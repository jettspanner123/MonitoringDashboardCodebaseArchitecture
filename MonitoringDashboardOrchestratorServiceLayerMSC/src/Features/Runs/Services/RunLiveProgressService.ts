import ApplicationDatabaseProvider from '../../../Providers/ApplicationDatabaseProvider';
import RunTriggerService from './RunTriggerService';

export interface RunProgressSnapshotInterface {
    running: string[];
    completed: string[];
    finished: boolean;
}

class RunLiveProgressCON {
    public static readonly POLL_INTERVAL_MS = 1000;
}

// Every poll recomputes the full current state from scratch rather than
// diffing against the previous tick - a check that starts and finishes
// between two polls (a fast page-load-only check, say) would otherwise never
// be observed as "running" at all, and a diff-based approach would miss it
// entirely. Reading straight from the completion tables each time means
// "completed" is never wrong, no matter how fast a check is.
export default class RunLiveProgressService {
    public static current = new RunLiveProgressService();

    public async getSnapshot(testRunId: string): Promise<RunProgressSnapshotInterface> {
        const client = ApplicationDatabaseProvider.current.client;

        const [inProgress, pingCheck, loginCheck, pageLoadChecks] = await Promise.all([
            client.inProgressCheck.findMany({ where: { testRunId }, select: { checkName: true } }),
            client.authenticationPingCheck.findFirst({ where: { testRunId }, select: { id: true } }),
            client.authenticationLoginCheck.findFirst({ where: { testRunId }, select: { id: true } }),
            client.pageLoadCheck.findMany({ where: { testRunId }, select: { pageName: true }, distinct: ['pageName'] }),
        ]);

        const completed = new Set<string>(pageLoadChecks.map((check) => check.pageName));
        if (pingCheck) completed.add('Authentication Ping');
        if (loginCheck) completed.add('Authentication Login');

        // A check briefly appears in both places (its InProgressCheck row is
        // deleted right after its completion row is written) - completed
        // always wins over running for that instant.
        const running = inProgress.map((check) => check.checkName).filter((name) => !completed.has(name));

        return {
            running,
            completed: Array.from(completed),
            finished: !RunTriggerService.current.isRunActive(),
        };
    }

    // Polls until the snapshot reports finished:true, calling onSnapshot only
    // when the computed state actually changed since the last tick. Returns a
    // function to call when the caller's own connection closes early, so
    // polling doesn't keep running for a client that's no longer listening.
    public startPolling(testRunId: string, onSnapshot: (snapshot: RunProgressSnapshotInterface) => void): () => void {
        let stopped = false;
        let previousSerialized = '';

        const tick = async (): Promise<void> => {
            if (stopped) return;

            const snapshot = await this.getSnapshot(testRunId);
            const serialized = JSON.stringify(snapshot);
            if (serialized !== previousSerialized) {
                previousSerialized = serialized;
                onSnapshot(snapshot);
            }

            if (!stopped && !snapshot.finished) {
                setTimeout(() => void tick(), RunLiveProgressCON.POLL_INTERVAL_MS);
            }
        };

        void tick();

        return () => {
            stopped = true;
        };
    }
}
