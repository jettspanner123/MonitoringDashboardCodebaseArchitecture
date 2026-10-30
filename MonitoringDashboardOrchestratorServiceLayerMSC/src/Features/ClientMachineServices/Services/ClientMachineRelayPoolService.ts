import { randomUUID } from 'node:crypto';

// Minimal structural shape of what this service needs from a relay's
// websocket connection - deliberately not importing `ws` types directly
// (this backend doesn't depend on `ws` itself; @fastify/websocket supplies
// the real socket, which already satisfies this shape, same as the
// untyped socket params already used in RunsController/ApplicationMonitorController).
export interface RelaySocketInterface {
    send(data: string): void;
    on(event: string, listener: (...args: unknown[]) => void): void;
}

export type RelayCommandType = 'login_check' | 'query' | 'query_all' | 'invoke';
export type RelayInvokeAction = 'start' | 'stop';

export interface RelayCommandRequest {
    requestId: string;
    type: RelayCommandType;
    hostname: string;
    username: string;
    password: string;
    // Required for "query" and "invoke", omitted for "login_check"/"query_all".
    serviceName?: string;
    // Required for "invoke" only.
    action?: RelayInvokeAction;
}

export interface RelayServiceStatusInterface {
    serviceName: string;
    stateCode: number | null;
    stateLabel: string | null;
}

export interface RelayCommandResponse {
    requestId: string;
    success: boolean;
    errorMessage: string | null;
    // Present for "login_check" (ignored), "query", and "invoke".
    service?: RelayServiceStatusInterface;
    // Present for "query_all" only.
    services?: RelayServiceStatusInterface[];
}

class ClientMachineRelayPoolCON {
    // Generous but bounded - a `net use` + `sc.exe` round trip over a
    // corporate LAN/VPN should complete in well under this; this just stops
    // a hung relay request from waiting forever.
    public static readonly COMMAND_TIMEOUT_MS = 20000;
}

interface PendingRelayRequestEntry {
    connectionId: string;
    resolve: (response: RelayCommandResponse) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
}

// Holds every currently-connected relay's websocket (one per person's
// machine, per the PRD's multi-relay design) and routes each outgoing
// command to any one of them - the caller doesn't know or care which
// physical relay actually services a given request.
export default class ClientMachineRelayPoolService {
    public static current = new ClientMachineRelayPoolService();

    private readonly connections = new Map<string, RelaySocketInterface>();
    private readonly pendingRequests = new Map<string, PendingRelayRequestEntry>();

    public registerRelay(connectionId: string, socket: RelaySocketInterface): void {
        this.connections.set(connectionId, socket);
    }

    // Rejects every request that happened to be routed to this specific
    // connection with a clear "that relay disconnected mid-flight" error,
    // rather than leaving them to time out silently.
    public unregisterRelay(connectionId: string): void {
        this.connections.delete(connectionId);

        for (const [requestId, pending] of this.pendingRequests.entries()) {
            if (pending.connectionId !== connectionId) continue;
            clearTimeout(pending.timeout);
            this.pendingRequests.delete(requestId);
            pending.reject(new Error('The relay handling this request disconnected before it finished.'));
        }
    }

    public isAnyRelayConnected(): boolean {
        return this.connections.size > 0;
    }

    public handleRelayMessage(rawMessage: string): void {
        let response: RelayCommandResponse;
        try {
            response = JSON.parse(rawMessage) as RelayCommandResponse;
        } catch {
            return;
        }

        const pending = this.pendingRequests.get(response.requestId);
        if (!pending) return;

        clearTimeout(pending.timeout);
        this.pendingRequests.delete(response.requestId);
        pending.resolve(response);
    }

    public sendCommand(command: Omit<RelayCommandRequest, 'requestId'>): Promise<RelayCommandResponse> {
        const firstEntry = this.connections.entries().next();
        if (firstEntry.done) {
            return Promise.reject(new Error('No relay is currently connected.'));
        }
        const [connectionId, socket] = firstEntry.value;
        const requestId = randomUUID();
        const fullCommand: RelayCommandRequest = { ...command, requestId };

        return new Promise<RelayCommandResponse>((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                reject(new Error('Timed out waiting for a response from the relay.'));
            }, ClientMachineRelayPoolCON.COMMAND_TIMEOUT_MS);

            this.pendingRequests.set(requestId, { connectionId, resolve, reject, timeout });

            try {
                socket.send(JSON.stringify(fullCommand));
            } catch (error) {
                clearTimeout(timeout);
                this.pendingRequests.delete(requestId);
                reject(error instanceof Error ? error : new Error(String(error)));
            }
        });
    }
}
