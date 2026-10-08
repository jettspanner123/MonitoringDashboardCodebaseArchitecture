import type { Prisma, Environment } from '@prisma/client';
import ApplicationDatabaseProvider from '../../../Providers/ApplicationDatabaseProvider';
import type HealthType from '../Models/HealthType';
import type PageCheckDTO from '../Models/PageCheckDTO';
import type RunDetailDTO from '../Models/RunDetailDTO';
import type RunSummaryDTO from '../Models/RunSummaryDTO';

const RUN_WITH_CHECKS_INCLUDE = {
    pingChecks: true,
    loginChecks: true,
    pageLoadChecks: true,
    indexingFreshnessChecks: true,
    queueStatusChecks: true,
} satisfies Prisma.TestRunInclude;

type RunWithChecks = Prisma.TestRunGetPayload<{ include: typeof RUN_WITH_CHECKS_INCLUDE }>;

export default class RunsService {
    public static current = new RunsService();

    // Public - PushNotificationService reuses this exact logic so a run's
    // computed health can never drift between what the dashboard displays
    // and what decides whether a push notification fires for it.
    public computeHealth(pageChecks: PageCheckDTO[]): HealthType {
        if (pageChecks.some((check) => check.status === 'Fail' || check.status === 'Error')) {
            return 'Failed';
        }
        if (pageChecks.some((check) => check.status === 'Warning')) {
            return 'Degraded';
        }
        return 'Healthy';
    }

    // environment is filtered here, in the query itself, rather than
    // fetched unfiltered and narrowed down in the frontend - runs for
    // environments the caller isn't looking at are never sent over the
    // wire at all.
    public async listRuns(environment?: Environment): Promise<RunSummaryDTO[]> {
        const runs = await ApplicationDatabaseProvider.current.client.testRun.findMany({
            where: environment ? { environment } : undefined,
            orderBy: { createdAt: 'desc' },
            include: RUN_WITH_CHECKS_INCLUDE,
        });

        return runs.map((run) => {
            const pageChecks = this.mapRunToPageChecks(run);
            return {
                id: run.id,
                createdAt: run.createdAt.toISOString(),
                environment: run.environment,
                health: this.computeHealth(pageChecks),
                pageCheckCount: pageChecks.length,
            };
        });
    }

    public async getRunById(id: string): Promise<RunDetailDTO | null> {
        const run = await ApplicationDatabaseProvider.current.client.testRun.findUnique({
            where: { id },
            include: RUN_WITH_CHECKS_INCLUDE,
        });

        if (!run) {
            return null;
        }

        const pageChecks = this.mapRunToPageChecks(run);
        return {
            id: run.id,
            createdAt: run.createdAt.toISOString(),
            environment: run.environment,
            health: this.computeHealth(pageChecks),
            pageChecks,
        };
    }

    // Translates the flat, per-check-type tables into CONTEXT.md's PageCheck
    // vocabulary. QueueStatusCheck is the one exception: it's several rows
    // (one per state) per actual check, so those are grouped into a single
    // PageCheck per pageName with all states nested under `details.states`.
    private mapRunToPageChecks(run: RunWithChecks): PageCheckDTO[] {
        const pageChecks: PageCheckDTO[] = [];

        for (const check of run.pingChecks) {
            pageChecks.push({
                id: check.id,
                pageName: 'Authentication',
                checkType: 'AuthenticationPing',
                status: check.success ? 'Pass' : 'Fail',
                message: check.message,
                details: { statusCode: check.statusCode },
                createdAt: check.createdAt.toISOString(),
            });
        }

        for (const check of run.loginChecks) {
            pageChecks.push({
                id: check.id,
                pageName: 'Authentication',
                checkType: 'AuthenticationLogin',
                // `password` (encrypted) is intentionally never included here.
                status: check.success ? 'Pass' : 'Fail',
                message: check.message,
                details: { username: check.username },
                createdAt: check.createdAt.toISOString(),
            });
        }

        for (const check of run.pageLoadChecks) {
            pageChecks.push({
                id: check.id,
                pageName: check.pageName,
                checkType: 'PageLoad',
                status: check.success ? 'Pass' : 'Fail',
                message: check.message,
                details: {
                    statusCode: check.statusCode,
                    durationMs: check.durationMs,
                    technicalReason: check.technicalReason,
                },
                createdAt: check.createdAt.toISOString(),
            });
        }

        for (const check of run.indexingFreshnessChecks) {
            pageChecks.push({
                id: check.id,
                // IndexingFreshnessCheck has no pageName column — it's only
                // ever produced by the 3DSpace search flow.
                pageName: '3DSpace search',
                checkType: 'IndexingFreshness',
                status: check.isFresh ? 'Pass' : 'Warning',
                message: check.message,
                details: {
                    resultCount: check.resultCount,
                    indexTime: check.indexTime.toISOString(),
                    machineTime: check.machineTime.toISOString(),
                    timeDifferenceMinutes: check.timeDifference,
                },
                createdAt: check.createdAt.toISOString(),
            });
        }

        const queueStatusByPage = new Map<string, typeof run.queueStatusChecks>();
        for (const check of run.queueStatusChecks) {
            const existing = queueStatusByPage.get(check.pageName);
            if (existing) {
                existing.push(check);
            } else {
                queueStatusByPage.set(check.pageName, [check]);
            }
        }
        for (const [pageName, checks] of queueStatusByPage) {
            pageChecks.push({
                id: checks.map((check) => check.id).join(','),
                pageName,
                checkType: 'QueueStatus',
                status: 'Pass',
                message: `${checks.length} queue state(s) captured.`,
                details: {
                    states: checks.map((check) => ({
                        state: check.state,
                        lessThan10Min: check.lessThan10Min,
                        lessThan1Hour: check.lessThan1Hour,
                        lessThan4Hours: check.lessThan4Hours,
                        greaterThan4Hours: check.greaterThan4Hours,
                    })),
                },
                createdAt: checks[0]!.createdAt.toISOString(),
            });
        }

        return pageChecks;
    }
}
