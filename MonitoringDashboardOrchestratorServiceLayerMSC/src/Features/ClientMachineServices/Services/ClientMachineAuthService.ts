import jwt from 'jsonwebtoken';
import { randomUUID, createHash } from 'node:crypto';
import ApplicationDatabaseProvider from '../../../Providers/ApplicationDatabaseProvider';
import ValidationCException from '../../../Exceptions/ValidationCException';
import ClientMachineRelayPoolService from './ClientMachineRelayPoolService';
import ClientMachinePasswordEncryptionUtility from '../Utilities/ClientMachinePasswordEncryptionUtility';

export interface ClientMachineTokenPairInterface {
    accessToken: string;
    refreshToken: string;
}

export interface ClientMachineAccessTokenPayloadInterface {
    username: string;
}

class ClientMachineAuthCON {
    // PRD section 3a, confirmed lifetimes.
    public static readonly ACCESS_TOKEN_TTL_SECONDS = 30 * 60;
    public static readonly REFRESH_TOKEN_TTL_MS = 2 * 24 * 60 * 60 * 1000;
}

export default class ClientMachineAuthService {
    public static current = new ClientMachineAuthService();

    private getJwtSecret(): string {
        const secret = process.env.CLIENT_MACHINE_JWT_SECRET;
        if (!secret) {
            throw new Error('Missing CLIENT_MACHINE_JWT_SECRET environment variable.');
        }
        return secret;
    }

    private hashRefreshToken(refreshToken: string): string {
        return createHash('sha256').update(refreshToken).digest('hex');
    }

    // A real net use attempt against the first configured machine - just
    // establishing the IPC$ session is proof enough the credentials work
    // (PRD section 3a, step 2). "First" = earliest-seeded machine.
    private async runLoginCheck(
        username: string,
        password: string
    ): Promise<{ success: boolean; errorMessage: string | null }> {
        const firstMachine = await ApplicationDatabaseProvider.current.client.clientMachine.findFirst({
            orderBy: { createdAt: 'asc' },
        });
        if (!firstMachine) {
            return { success: false, errorMessage: 'No client machines are configured.' };
        }

        const response = await ClientMachineRelayPoolService.current.sendCommand({
            type: 'login_check',
            hostname: firstMachine.hostname,
            username,
            password,
        });

        return { success: response.success, errorMessage: response.errorMessage };
    }

    private async issueTokenPair(username: string, password: string): Promise<ClientMachineTokenPairInterface> {
        const accessToken = jwt.sign({ username }, this.getJwtSecret(), {
            expiresIn: ClientMachineAuthCON.ACCESS_TOKEN_TTL_SECONDS,
        });

        const refreshToken = randomUUID() + randomUUID();
        const expiresAt = new Date(Date.now() + ClientMachineAuthCON.REFRESH_TOKEN_TTL_MS);

        await ApplicationDatabaseProvider.current.client.clientMachineRefreshToken.create({
            data: {
                username,
                refreshTokenHash: this.hashRefreshToken(refreshToken),
                encryptedPassword: ClientMachinePasswordEncryptionUtility.current.encrypt(password),
                expiresAt,
            },
        });

        return { accessToken, refreshToken };
    }

    public async login(username: string, password: string): Promise<ClientMachineTokenPairInterface> {
        const checkResult = await this.runLoginCheck(username, password);
        if (!checkResult.success) {
            throw new ValidationCException(checkResult.errorMessage || 'Could not log in with those credentials.');
        }
        return this.issueTokenPair(username, password);
    }

    // Silent daily re-validation (PRD section 3a, step 5) - decrypts the
    // stored password and re-runs the exact same real net use check. If
    // today's password has rotated, this fails and the stored row is
    // revoked, forcing the login modal to reappear.
    public async refresh(refreshToken: string): Promise<ClientMachineTokenPairInterface> {
        const tokenHash = this.hashRefreshToken(refreshToken);
        const storedToken = await ApplicationDatabaseProvider.current.client.clientMachineRefreshToken.findUnique({
            where: { refreshTokenHash: tokenHash },
        });

        if (!storedToken || storedToken.revokedAt || storedToken.expiresAt.getTime() < Date.now()) {
            throw new ValidationCException('Session has expired. Please log in again.');
        }

        const password = ClientMachinePasswordEncryptionUtility.current.decrypt(storedToken.encryptedPassword);
        const checkResult = await this.runLoginCheck(storedToken.username, password);

        if (!checkResult.success) {
            await ApplicationDatabaseProvider.current.client.clientMachineRefreshToken.update({
                where: { id: storedToken.id },
                data: { revokedAt: new Date() },
            });
            throw new ValidationCException(
                checkResult.errorMessage || "Today's password no longer works. Please log in again."
            );
        }

        // Rotate: revoke the old row, issue a fresh one - avoids an
        // unbounded chain of still-valid rows for the same login.
        await ApplicationDatabaseProvider.current.client.clientMachineRefreshToken.update({
            where: { id: storedToken.id },
            data: { revokedAt: new Date() },
        });

        return this.issueTokenPair(storedToken.username, password);
    }

    public verifyAccessToken(accessToken: string): ClientMachineAccessTokenPayloadInterface {
        const payload = jwt.verify(accessToken, this.getJwtSecret());
        if (typeof payload === 'string' || !payload || typeof payload.username !== 'string') {
            throw new ValidationCException('Invalid access token.');
        }
        return { username: payload.username };
    }
}
