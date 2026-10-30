export type ServiceActionOutcome = 'running' | 'succeeded' | 'failed';
export type ServiceActionPhase = 'stopping' | 'starting' | 'checking';

export interface ServiceActionAttemptEntryInterface {
    attemptNumber: number;
    phase: ServiceActionPhase;
    stateCode: number | null;
    stateLabel: string | null;
    attemptedAt: string;
    outcome: ServiceActionOutcome;
}

export interface ServiceActionResultInterface {
    success: boolean;
    finalStateCode: number | null;
    finalStateLabel: string | null;
    errorMessage: string | null;
    durationMs: number;
}

export interface ServiceActionSnapshotInterface {
    attempts: ServiceActionAttemptEntryInterface[];
    finished: boolean;
    result: ServiceActionResultInterface | null;
}

class ClientMachineServiceActionTrackerCON {
    public static readonly POLL_INTERVAL_MS = 300;
    public static readonly CLEANUP_DELAY_MS = 60000;
}

// In-memory only, same shape and reasoning as
// ApplicationEndpointHitAttemptTrackerService - lets a currently-open
// websocket watch one in-flight Start/Stop/Restart action live. A Restart is
// multi-step (stop, poll, start, poll) so this is where that progress is
// staged before the final outcome gets written to
// MD_ClientMachineServiceActionAuditTBL by the caller.
export default class ClientMachineServiceActionTrackerService {
    public static current = new ClientMachineServiceActionTrackerService();

    private readonly sessions = new Map<string, ServiceActionSnapshotInterface>();

    public startTracking(actionAttemptId: string): void {
        this.sessions.set(actionAttemptId, { attempts: [], finished: false, result: null });
    }

    public recordAttempt(actionAttemptId: string, entry: ServiceActionAttemptEntryInterface): void {
        const session = this.sessions.get(actionAttemptId);
        if (!session) return;
        session.attempts.push(entry);
    }

    public finish(actionAttemptId: string, result: ServiceActionResultInterface): void {
        const session = this.sessions.get(actionAttemptId);
        if (!session) return;
        session.finished = true;
        session.result = result;
        setTimeout(() => this.sessions.delete(actionAttemptId), ClientMachineServiceActionTrackerCON.CLEANUP_DELAY_MS);
    }

    public getSnapshot(actionAttemptId: string): ServiceActionSnapshotInterface | null {
        return this.sessions.get(actionAttemptId) ?? null;
    }

    public startPolling(
        actionAttemptId: string,
        onSnapshot: (snapshot: ServiceActionSnapshotInterface) => void
    ): () => void {
        let stopped = false;
        let previousSerialized = '';

        const tick = (): void => {
            if (stopped) return;

            const snapshot = this.getSnapshot(actionAttemptId);
            if (snapshot) {
                const serialized = JSON.stringify(snapshot);
                if (serialized !== previousSerialized) {
                    previousSerialized = serialized;
                    onSnapshot(snapshot);
                }
                if (snapshot.finished) return;
            }

            if (!stopped) {
                setTimeout(tick, ClientMachineServiceActionTrackerCON.POLL_INTERVAL_MS);
            }
        };

        tick();

        return () => {
            stopped = true;
        };
    }
}
