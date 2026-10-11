import type { EndpointHitResultDTO } from './ApplicationMonitorService';

export type HitAttemptOutcome = 'retrying' | 'succeeded' | 'failed';

export interface HitAttemptEntryInterface {
    attemptNumber: number;
    statusCode: number | null;
    errorMessage: string | null;
    attemptedAt: string;
    outcome: HitAttemptOutcome;
}

export interface HitAttemptSnapshotInterface {
    attempts: HitAttemptEntryInterface[];
    finished: boolean;
    result: EndpointHitResultDTO | null;
}

class ApplicationEndpointHitAttemptTrackerCON {
    public static readonly POLL_INTERVAL_MS = 300;
    // A finished session isn't useful once nobody's watching - clear it a
    // short while later so this in-memory map can't grow forever across many
    // "Hit" clicks over a long-running server process.
    public static readonly CLEANUP_DELAY_MS = 60000;
}

// In-memory only, deliberately - these sessions exist purely to let a
// currently-open websocket watch one in-flight "Hit" click live. Nothing here
// needs to survive a server restart or be visible across instances; the one
// thing worth keeping (the final outcome) is already persisted separately to
// MD_ApplicationEndpointHitHistoryTBL by the caller once a session finishes.
export default class ApplicationEndpointHitAttemptTrackerService {
    public static current = new ApplicationEndpointHitAttemptTrackerService();

    private readonly sessions = new Map<string, HitAttemptSnapshotInterface>();

    public startTracking(hitAttemptId: string): void {
        this.sessions.set(hitAttemptId, { attempts: [], finished: false, result: null });
    }

    public recordAttempt(hitAttemptId: string, entry: HitAttemptEntryInterface): void {
        const session = this.sessions.get(hitAttemptId);
        if (!session) return;
        session.attempts.push(entry);
    }

    public finish(hitAttemptId: string, result: EndpointHitResultDTO): void {
        const session = this.sessions.get(hitAttemptId);
        if (!session) return;
        session.finished = true;
        session.result = result;
        setTimeout(() => this.sessions.delete(hitAttemptId), ApplicationEndpointHitAttemptTrackerCON.CLEANUP_DELAY_MS);
    }

    public getSnapshot(hitAttemptId: string): HitAttemptSnapshotInterface | null {
        return this.sessions.get(hitAttemptId) ?? null;
    }

    // Mirrors RunLiveProgressService.startPolling's shape exactly (poll, push
    // only on change, stop once finished, return an unsubscribe for the
    // caller's own connection close) - same pattern, shorter interval since a
    // hit-attempt session is expected to be seconds long, not minutes.
    public startPolling(hitAttemptId: string, onSnapshot: (snapshot: HitAttemptSnapshotInterface) => void): () => void {
        let stopped = false;
        let previousSerialized = '';

        const tick = (): void => {
            if (stopped) return;

            const snapshot = this.getSnapshot(hitAttemptId);
            if (snapshot) {
                const serialized = JSON.stringify(snapshot);
                if (serialized !== previousSerialized) {
                    previousSerialized = serialized;
                    onSnapshot(snapshot);
                }
                if (snapshot.finished) return;
            }

            if (!stopped) {
                setTimeout(tick, ApplicationEndpointHitAttemptTrackerCON.POLL_INTERVAL_MS);
            }
        };

        tick();

        return () => {
            stopped = true;
        };
    }
}
