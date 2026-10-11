import { randomUUID } from 'node:crypto';
import ApplicationDatabaseProvider from '../../../Providers/ApplicationDatabaseProvider';
import EntityNotFoundCException from '../../../Exceptions/EntityNotFoundCException';
import ValidationCException from '../../../Exceptions/ValidationCException';
import ApplicationEndpointHitAttemptTrackerService from './ApplicationEndpointHitAttemptTrackerService';

// Today's only checkType - a new check type (e.g. "DatabaseConnection") gets
// its own config shape and its own branch in executeCheck, no schema change.
interface HttpEndpointConfigInterface {
    method: string;
    path: string;
    expectedStatusCode: number;
    // Absent for today's GET-only health/ping checks. Once POST-style checks
    // with an actual payload are added, this carries that payload - the
    // frontend's "Copy Request JSON" context menu item disables itself when
    // this is undefined.
    requestBody?: unknown;
}

export interface ApplicationEndpointDTO {
    id: string;
    label: string;
    checkType: string;
    config: unknown;
    // The most recently recorded hit for this endpoint (from
    // MD_ApplicationEndpointHitHistoryTBL), regardless of success/failure -
    // null if it has never been hit. Lets a card and the page header show
    // "as of last time" state immediately on load, not just after a fresh
    // click this session.
    lastHit: (EndpointHitResultDTO & { checkedAt: string }) | null;
}

export interface MonitoredApplicationDTO {
    id: string;
    slug: string;
    name: string;
    baseUrl: string;
    iconName: string | null;
    endpoints: ApplicationEndpointDTO[];
}

export interface EndpointHitResultDTO {
    success: boolean;
    statusCode: number | null;
    responseBody: unknown;
    durationMs: number;
    errorMessage: string | null;
}

class ApplicationMonitorCON {
    // A sibling app on Render's free tier spins down after ~15 minutes idle;
    // the next request wakes it, and Render's own edge proxy answers with a
    // fast 502/503/504 (not a hang) for every request that arrives before the
    // app has bound to its port - repeatedly, for the whole cold-start window
    // (documented at 30-60s, sometimes up to ~2 minutes). So a single fetch
    // with a long timeout doesn't help; this has to retry across that window
    // instead. Per-attempt timeout stays short since a 502 passthrough is
    // fast - it's only a safety net for a genuinely hung attempt, not meant
    // to itself cover the cold-start wait.
    public static readonly PER_ATTEMPT_TIMEOUT_MS = 10000;
    public static readonly RETRY_INTERVAL_MS = 3000;
    public static readonly MAX_RETRY_BUDGET_MS = 75000;
    public static readonly RETRYABLE_STATUS_CODES: number[] = [502, 503, 504];
}

export default class ApplicationMonitorService {
    public static current = new ApplicationMonitorService();

    public async getApplications(): Promise<MonitoredApplicationDTO[]> {
        const applications = await ApplicationDatabaseProvider.current.client.monitoredApplication.findMany({
            include: {
                endpoints: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                },
            },
            orderBy: { name: 'asc' },
        });

        const endpointIds = applications.flatMap((application) => application.endpoints.map((endpoint) => endpoint.id));

        // distinct + orderBy gives "the newest row per endpointId" in one
        // query rather than one query per endpoint.
        const latestHits = endpointIds.length > 0
            ? await ApplicationDatabaseProvider.current.client.applicationEndpointHit.findMany({
                where: { endpointId: { in: endpointIds } },
                orderBy: { checkedAt: 'desc' },
                distinct: ['endpointId'],
            })
            : [];
        const latestHitByEndpointId = new Map(latestHits.map((hit) => [hit.endpointId, hit]));

        return applications.map((application) => ({
            id: application.id,
            slug: application.slug,
            name: application.name,
            baseUrl: application.baseUrl,
            iconName: application.iconName,
            endpoints: application.endpoints.map((endpoint) => {
                const latestHit = latestHitByEndpointId.get(endpoint.id);

                return {
                    id: endpoint.id,
                    label: endpoint.label,
                    checkType: endpoint.checkType,
                    config: JSON.parse(endpoint.config) as unknown,
                    lastHit: latestHit
                        ? {
                            success: latestHit.success,
                            statusCode: latestHit.statusCode,
                            responseBody:
                                latestHit.responseBody !== null ? (JSON.parse(latestHit.responseBody) as unknown) : null,
                            durationMs: latestHit.durationMs,
                            errorMessage: latestHit.errorMessage,
                            checkedAt: latestHit.checkedAt.toISOString(),
                        }
                        : null,
                };
            }),
        }));
    }

    // Validates the endpoint up front (so a bad id still 404s on this call
    // immediately, same as before) then kicks off the retry-aware hit in the
    // background and returns right away. The caller's HTTP response is just
    // this id - the frontend watches the actual outcome live via the paired
    // GET .../hit-attempts/:hitAttemptId/live websocket instead of the
    // original POST blocking for up to the full retry budget.
    public async startHit(endpointId: string): Promise<string> {
        const endpoint = await ApplicationDatabaseProvider.current.client.applicationEndpoint.findUnique({
            where: { id: endpointId },
            include: { application: true },
        });

        if (!endpoint) {
            throw new EntityNotFoundCException(`No endpoint found with id "${endpointId}".`);
        }

        if (endpoint.checkType !== 'HttpEndpoint') {
            throw new ValidationCException(`Unsupported checkType "${endpoint.checkType}".`);
        }

        const config = JSON.parse(endpoint.config) as HttpEndpointConfigInterface;
        const hitAttemptId = randomUUID();
        ApplicationEndpointHitAttemptTrackerService.current.startTracking(hitAttemptId);

        void this.executeHitWithRetries(endpoint.id, endpoint.application.baseUrl, config, hitAttemptId);

        return hitAttemptId;
    }

    private async executeHitWithRetries(
        endpointId: string,
        baseUrl: string,
        config: HttpEndpointConfigInterface,
        hitAttemptId: string
    ): Promise<void> {
        const url = `${baseUrl}${config.path}`;
        const overallStartedAt = Date.now();
        let attemptNumber = 0;
        let result: EndpointHitResultDTO;

        for (;;) {
            attemptNumber += 1;

            let attemptStatusCode: number | null = null;
            let attemptErrorMessage: string | null = null;
            let responseBody: unknown = null;
            let isRetryableOutcome = false;

            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), ApplicationMonitorCON.PER_ATTEMPT_TIMEOUT_MS);
                const response = await fetch(url, { method: config.method, signal: controller.signal });
                clearTimeout(timeout);

                attemptStatusCode = response.status;
                isRetryableOutcome = ApplicationMonitorCON.RETRYABLE_STATUS_CODES.includes(response.status);

                const rawBody = await response.text();
                try {
                    responseBody = JSON.parse(rawBody);
                } catch {
                    responseBody = rawBody;
                }
            } catch (error) {
                // A network-level failure (connection refused, DNS, the
                // per-attempt timeout) reads the same as a gateway 502 here -
                // both just mean "not answering yet" during a cold start.
                attemptErrorMessage = error instanceof Error ? error.message : String(error);
                isRetryableOutcome = true;
            }

            const elapsedMs = Date.now() - overallStartedAt;
            const budgetExhausted = elapsedMs >= ApplicationMonitorCON.MAX_RETRY_BUDGET_MS;
            const isFinalAttempt = !isRetryableOutcome || budgetExhausted;

            ApplicationEndpointHitAttemptTrackerService.current.recordAttempt(hitAttemptId, {
                attemptNumber,
                statusCode: attemptStatusCode,
                errorMessage: attemptErrorMessage,
                attemptedAt: new Date().toISOString(),
                outcome: !isFinalAttempt ? 'retrying' : isRetryableOutcome ? 'failed' : 'succeeded',
            });

            if (isFinalAttempt) {
                const succeeded = !isRetryableOutcome;
                result = {
                    success: succeeded,
                    statusCode: attemptStatusCode,
                    responseBody: succeeded ? responseBody : null,
                    durationMs: Date.now() - overallStartedAt,
                    errorMessage: succeeded
                        ? null
                        : attemptErrorMessage ??
                          `Server did not come up after ${attemptNumber} attempt(s) over ${Math.round(
                              (Date.now() - overallStartedAt) / 1000
                          )}s (last status: ${attemptStatusCode ?? 'network error'}).`,
                };
                break;
            }

            await new Promise((resolve) => setTimeout(resolve, ApplicationMonitorCON.RETRY_INTERVAL_MS));
        }

        await ApplicationDatabaseProvider.current.client.applicationEndpointHit.create({
            data: {
                endpointId,
                success: result.success,
                statusCode: result.statusCode,
                responseBody: result.responseBody !== null ? JSON.stringify(result.responseBody) : null,
                durationMs: result.durationMs,
                errorMessage: result.errorMessage,
            },
        });

        ApplicationEndpointHitAttemptTrackerService.current.finish(hitAttemptId, result);
    }
}
