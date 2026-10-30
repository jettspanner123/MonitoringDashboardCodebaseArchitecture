import * as crypto from 'crypto';

// Mirrors MorningSmokeTestAutomation's EncryptionHelper exactly (same
// aes-256-gcm algorithm and iv:authTag:ciphertext hex format) - a different
// key (CLIENT_MACHINE_PASSWORD_ENCRYPTION_KEY) and a different secret
// (the daily-rotating VM password, not a DB credential), but the same
// approach, per the PRD's explicit "mirrors the DB_ENCRYPTION_KEY pattern".
class ClientMachinePasswordEncryptionCON {
    public static readonly ALGORITHM = 'aes-256-gcm';
}

export default class ClientMachinePasswordEncryptionUtility {
    public static current = new ClientMachinePasswordEncryptionUtility();

    private getKey(): Buffer {
        const keyHex = process.env.CLIENT_MACHINE_PASSWORD_ENCRYPTION_KEY;
        if (!keyHex) {
            throw new Error('Missing CLIENT_MACHINE_PASSWORD_ENCRYPTION_KEY environment variable.');
        }
        return Buffer.from(keyHex, 'hex');
    }

    // Returns "iv:authTag:ciphertext", all hex-encoded.
    public encrypt(plainText: string): string {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(ClientMachinePasswordEncryptionCON.ALGORITHM, this.getKey(), iv);
        const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();

        return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':');
    }

    public decrypt(cipherText: string): string {
        const [ivHex, authTagHex, encryptedHex] = cipherText.split(':');
        const decipher = crypto.createDecipheriv(
            ClientMachinePasswordEncryptionCON.ALGORITHM,
            this.getKey(),
            Buffer.from(ivHex, 'hex')
        );
        decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
        const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]);

        return decrypted.toString('utf8');
    }
}
