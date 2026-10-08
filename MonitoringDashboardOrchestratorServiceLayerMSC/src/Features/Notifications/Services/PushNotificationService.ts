import ApplicationDatabaseProvider from '../../../Providers/ApplicationDatabaseProvider';
import WebPushProvider from '../../../Providers/WebPushProvider';
import RunsService from '../../Runs/Services/RunsService';

export interface PushSubscriptionKeysInterface {
    endpoint: string;
    p256dh: string;
    auth: string;
}

class PushNotificationCON {
    // The single NotificationCheckpoint row's fixed id.
    public static readonly CHECKPOINT_ID = 1;
}

// Detection is poll-based, hit by an external cron (see MonitoringDashboardAgentDocumentationNMCS
// for the ADR, if one gets written) rather than an in-process timer - this
// backend's free Render plan sleeps after ~15 minutes idle, so nothing would
// be running a timer when nobody's visiting the dashboard anyway.
export default class PushNotificationService {
    public static current = new PushNotificationService();

    public getVapidPublicKey(): string {
        return process.env.VAPID_PUBLIC_KEY ?? '';
    }

    public async subscribe(subscription: PushSubscriptionKeysInterface): Promise<void> {
        await ApplicationDatabaseProvider.current.client.pushSubscription.upsert({
            where: { endpoint: subscription.endpoint },
            create: {
                endpoint: subscription.endpoint,
                p256dhKey: subscription.p256dh,
                authKey: subscription.auth,
            },
            update: {
                p256dhKey: subscription.p256dh,
                authKey: subscription.auth,
            },
        });
    }

    public async unsubscribe(endpoint: string): Promise<void> {
        await ApplicationDatabaseProvider.current.client.pushSubscription.deleteMany({ where: { endpoint } });
    }

    // Finds every run newer than the last one already examined, sends a push
    // for each Degraded/Failed one found (oldest first, so pushes land in
    // the order the runs actually happened), then advances the checkpoint to
    // the newest run seen - healthy or not - so no run is ever examined
    // twice even across many check ticks between real smoke test runs.
    public async checkAndNotify(): Promise<{ notifiedRunIds: string[] }> {
        const checkpoint = await ApplicationDatabaseProvider.current.client.notificationCheckpoint.upsert({
            where: { id: PushNotificationCON.CHECKPOINT_ID },
            create: { id: PushNotificationCON.CHECKPOINT_ID },
            update: {},
        });

        const allRuns = await RunsService.current.listRuns();
        const sortedOldestFirst = [...allRuns].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        const lastNotifiedIndex = checkpoint.lastNotifiedRunId
            ? sortedOldestFirst.findIndex((run) => run.id === checkpoint.lastNotifiedRunId)
            : -1;
        const unseenRuns = sortedOldestFirst.slice(lastNotifiedIndex + 1);

        if (unseenRuns.length === 0) {
            return { notifiedRunIds: [] };
        }

        const notifiedRunIds: string[] = [];
        for (const run of unseenRuns) {
            if (run.health === 'Degraded' || run.health === 'Failed') {
                await this.sendPushToAllSubscriptions(run);
                notifiedRunIds.push(run.id);
            }
        }

        const newestRun = unseenRuns[unseenRuns.length - 1]!;
        await ApplicationDatabaseProvider.current.client.notificationCheckpoint.update({
            where: { id: PushNotificationCON.CHECKPOINT_ID },
            data: { lastNotifiedRunId: newestRun.id },
        });

        return { notifiedRunIds };
    }

    private async sendPushToAllSubscriptions(run: { id: string; environment: string | null; health: string }): Promise<void> {
        const subscriptions = await ApplicationDatabaseProvider.current.client.pushSubscription.findMany();
        if (subscriptions.length === 0) return;

        const payload = JSON.stringify({
            title: `ObservaCore: ${run.health} run${run.environment ? ` (${run.environment})` : ''}`,
            body: `The morning smoke test run came back ${run.health}. Open the dashboard for details.`,
        });

        await Promise.all(
            subscriptions.map(async (subscription) => {
                try {
                    await WebPushProvider.current.client.sendNotification(
                        {
                            endpoint: subscription.endpoint,
                            keys: { p256dh: subscription.p256dhKey, auth: subscription.authKey },
                        },
                        payload
                    );
                } catch (error) {
                    // A dead/expired subscription (its browser profile was
                    // removed, permission revoked, etc.) returns 404/410 -
                    // drop it instead of retrying it forever on every future check.
                    const statusCode = (error as { statusCode?: number }).statusCode;
                    if (statusCode === 404 || statusCode === 410) {
                        await ApplicationDatabaseProvider.current.client.pushSubscription.deleteMany({
                            where: { endpoint: subscription.endpoint },
                        });
                    }
                }
            })
        );
    }
}
