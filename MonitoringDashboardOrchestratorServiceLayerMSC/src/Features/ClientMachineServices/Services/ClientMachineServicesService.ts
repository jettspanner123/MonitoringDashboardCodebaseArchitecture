import { randomUUID } from 'node:crypto';
import ApplicationDatabaseProvider from '../../../Providers/ApplicationDatabaseProvider';
import EntityNotFoundCException from '../../../Exceptions/EntityNotFoundCException';
import ValidationCException from '../../../Exceptions/ValidationCException';
import ClientMachineRelayPoolService from './ClientMachineRelayPoolService';
import ClientMachineServiceActionTrackerService, {
    type ServiceActionOutcome,
    type ServiceActionPhase,
} from './ClientMachineServiceActionTrackerService';
import ClientMachinePasswordEncryptionUtility from '../Utilities/ClientMachinePasswordEncryptionUtility';

export type ClientMachineServiceAction = 'Start' | 'Stop' | 'Restart';

export interface ClientMachineDTO {
    id: string;
    hostname: string;
    nickname: string;
}

export interface ClientMachineServiceStatusDTO {
    serviceName: string;
    stateCode: number | null;
    stateLabel: string | null;
    errorMessage: string | null;
}

class ClientMachineServicesCON {
    // Standard SCM state codes (see the PRD's section 2).
    public static readonly RUNNING_STATE_CODE = 4;
    public static readonly STOPPED_STATE_CODE = 1;
    public static readonly ACTION_POLL_INTERVAL_MS = 1000;
    public static readonly ACTION_POLL_TIMEOUT_MS = 15000;
}

export default class ClientMachineServicesService {
    public static current = new ClientMachineServicesService();

    public async getMachines(): Promise<ClientMachineDTO[]> {
        const machines = await ApplicationDatabaseProvider.current.client.clientMachine.findMany({
            orderBy: { createdAt: 'asc' },
        });
        return machines.map((machine) => ({ id: machine.id, hostname: machine.hostname, nickname: machine.nickname }));
    }

    // The backend holds the user's password (encrypted) precisely so the
    // frontend never has to resend it for every query/action - see the
    // PRD's credential-persistence reversal (section 4).
    private async getStoredPassword(username: string): Promise<string> {
        const activeToken = await ApplicationDatabaseProvider.current.client.clientMachineRefreshToken.findFirst({
            where: { username, revokedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { issuedAt: 'desc' },
        });
        if (!activeToken) {
            throw new ValidationCException('Session has expired. Please log in again.');
        }
        return ClientMachinePasswordEncryptionUtility.current.decrypt(activeToken.encryptedPassword);
    }

    private async getMachineOrThrow(machineId: string) {
        const machine = await ApplicationDatabaseProvider.current.client.clientMachine.findUnique({
            where: { id: machineId },
        });
        if (!machine) {
            throw new EntityNotFoundCException(`No client machine found with id "${machineId}".`);
        }
        return machine;
    }

    // The curated default list (PRD section 5/6) - stored generically in
    // MD_ConfigurationConstantTBL (same shape as AssetSphere/SignForge's own
    // ConfigurationConstant tables), keyed per machine. A machine with no row
    // here (or an inactive one) has no curated defaults - the frontend falls
    // back to "Show all services".
    public async getCuratedServices(machineId: string, username: string): Promise<ClientMachineServiceStatusDTO[]> {
        const machine = await this.getMachineOrThrow(machineId);
        const password = await this.getStoredPassword(username);

        const config = await ApplicationDatabaseProvider.current.client.configurationConstant.findUnique({
            where: { configurationKey: `ClientMachineDefaultServices:${machine.hostname}` },
        });

        if (!config || !config.isActive) return [];

        const serviceNames = JSON.parse(config.configurationValue) as string[];

        return Promise.all(
            serviceNames.map(async (serviceName): Promise<ClientMachineServiceStatusDTO> => {
                const response = await ClientMachineRelayPoolService.current.sendCommand({
                    type: 'query',
                    hostname: machine.hostname,
                    username,
                    password,
                    serviceName,
                });
                return {
                    serviceName,
                    stateCode: response.success ? response.service?.stateCode ?? null : null,
                    stateLabel: response.success ? response.service?.stateLabel ?? null : null,
                    errorMessage: response.success ? null : response.errorMessage,
                };
            })
        );
    }

    public async getAllServices(machineId: string, username: string): Promise<ClientMachineServiceStatusDTO[]> {
        const machine = await this.getMachineOrThrow(machineId);
        const password = await this.getStoredPassword(username);

        const response = await ClientMachineRelayPoolService.current.sendCommand({
            type: 'query_all',
            hostname: machine.hostname,
            username,
            password,
        });

        if (!response.success) {
            throw new ValidationCException(response.errorMessage || 'Failed to query services on this machine.');
        }

        return (response.services ?? []).map((service) => ({
            serviceName: service.serviceName,
            stateCode: service.stateCode,
            stateLabel: service.stateLabel,
            errorMessage: null,
        }));
    }

    // Validates up front (so a bad machine id still 404s immediately) then
    // kicks off the actual Start/Stop/Restart in the background and returns
    // right away - mirrors ApplicationMonitorService.startHit's shape. The
    // caller watches progress live via the paired action-attempts websocket.
    public async startAction(
        machineId: string,
        serviceName: string,
        action: ClientMachineServiceAction,
        username: string
    ): Promise<string> {
        const machine = await this.getMachineOrThrow(machineId);
        const password = await this.getStoredPassword(username);

        const actionAttemptId = randomUUID();
        ClientMachineServiceActionTrackerService.current.startTracking(actionAttemptId);

        void this.executeAction(actionAttemptId, machine.id, machine.hostname, serviceName, action, username, password);

        return actionAttemptId;
    }

    // sc.exe has no atomic "invoke and confirm" - this sends the invoke
    // command once, then polls via "query" until the target state is
    // reached or the timeout elapses, recording every poll as a live
    // attempt. Shared by Start, Stop, and each half of Restart.
    private async invokeAndPollUntilState(
        hostname: string,
        username: string,
        password: string,
        serviceName: string,
        invokeAction: 'start' | 'stop',
        targetStateCode: number,
        phase: ServiceActionPhase,
        actionAttemptId: string,
        attemptNumberRef: { current: number }
    ): Promise<{ success: boolean; stateCode: number | null; stateLabel: string | null; errorMessage: string | null }> {
        const invokeResponse = await ClientMachineRelayPoolService.current.sendCommand({
            type: 'invoke',
            hostname,
            username,
            password,
            serviceName,
            action: invokeAction,
        });

        if (!invokeResponse.success) {
            attemptNumberRef.current += 1;
            ClientMachineServiceActionTrackerService.current.recordAttempt(actionAttemptId, {
                attemptNumber: attemptNumberRef.current,
                phase,
                stateCode: null,
                stateLabel: null,
                attemptedAt: new Date().toISOString(),
                outcome: 'failed',
            });
            return { success: false, stateCode: null, stateLabel: null, errorMessage: invokeResponse.errorMessage };
        }

        const pollStartedAt = Date.now();
        for (;;) {
            const queryResponse = await ClientMachineRelayPoolService.current.sendCommand({
                type: 'query',
                hostname,
                username,
                password,
                serviceName,
            });

            const stateCode = queryResponse.success ? queryResponse.service?.stateCode ?? null : null;
            const stateLabel = queryResponse.success ? queryResponse.service?.stateLabel ?? null : null;
            const reachedTarget = queryResponse.success && stateCode === targetStateCode;
            const timedOut = Date.now() - pollStartedAt >= ClientMachineServicesCON.ACTION_POLL_TIMEOUT_MS;
            const outcome: ServiceActionOutcome = reachedTarget ? 'succeeded' : timedOut ? 'failed' : 'running';

            attemptNumberRef.current += 1;
            ClientMachineServiceActionTrackerService.current.recordAttempt(actionAttemptId, {
                attemptNumber: attemptNumberRef.current,
                phase,
                stateCode,
                stateLabel,
                attemptedAt: new Date().toISOString(),
                outcome,
            });

            if (reachedTarget) {
                return { success: true, stateCode, stateLabel, errorMessage: null };
            }
            if (timedOut) {
                return {
                    success: false,
                    stateCode,
                    stateLabel,
                    errorMessage: queryResponse.errorMessage || `Timed out waiting for the service to reach the target state.`,
                };
            }

            await new Promise((resolve) => setTimeout(resolve, ClientMachineServicesCON.ACTION_POLL_INTERVAL_MS));
        }
    }

    private async executeAction(
        actionAttemptId: string,
        machineId: string,
        hostname: string,
        serviceName: string,
        action: ClientMachineServiceAction,
        username: string,
        password: string
    ): Promise<void> {
        const startedAt = Date.now();
        const attemptNumberRef = { current: 0 };
        let success = false;
        let finalStateCode: number | null = null;
        let finalStateLabel: string | null = null;
        let errorMessage: string | null = null;

        try {
            let shouldRunStartPhase = action === 'Start';

            if (action === 'Stop' || action === 'Restart') {
                const stopResult = await this.invokeAndPollUntilState(
                    hostname,
                    username,
                    password,
                    serviceName,
                    'stop',
                    ClientMachineServicesCON.STOPPED_STATE_CODE,
                    'stopping',
                    actionAttemptId,
                    attemptNumberRef
                );
                success = stopResult.success;
                finalStateCode = stopResult.stateCode;
                finalStateLabel = stopResult.stateLabel;
                errorMessage = stopResult.errorMessage;
                // Restart only proceeds to the start phase if stopping
                // actually succeeded - a failed stop stays the final result.
                shouldRunStartPhase = action === 'Restart' && success;
            }

            if (shouldRunStartPhase) {
                const startResult = await this.invokeAndPollUntilState(
                    hostname,
                    username,
                    password,
                    serviceName,
                    'start',
                    ClientMachineServicesCON.RUNNING_STATE_CODE,
                    'starting',
                    actionAttemptId,
                    attemptNumberRef
                );
                success = startResult.success;
                finalStateCode = startResult.stateCode;
                finalStateLabel = startResult.stateLabel;
                errorMessage = startResult.errorMessage;
            }
        } catch (error) {
            success = false;
            errorMessage = error instanceof Error ? error.message : String(error);
        }

        const durationMs = Date.now() - startedAt;

        await ApplicationDatabaseProvider.current.client.clientMachineServiceAction.create({
            data: {
                machineId,
                serviceName,
                action,
                performedBy: username,
                succeeded: success,
                errorMessage,
                durationMs,
            },
        });

        ClientMachineServiceActionTrackerService.current.finish(actionAttemptId, {
            success,
            finalStateCode,
            finalStateLabel,
            errorMessage,
            durationMs,
        });
    }
}
