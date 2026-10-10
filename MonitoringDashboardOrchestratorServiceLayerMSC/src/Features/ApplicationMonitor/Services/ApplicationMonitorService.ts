import ApplicationDatabaseProvider from '../../../Providers/ApplicationDatabaseProvider';
import EntityNotFoundCException from '../../../Exceptions/EntityNotFoundCException';
import ValidationCException from '../../../Exceptions/ValidationCException';

// Today's only checkType - a new check type (e.g. "DatabaseConnection") gets
// its own config shape and its own branch in executeCheck, no schema change.
interface HttpEndpointConfigInterface {
    method: string;
    path: string;
    expectedStatusCode: number;
}

export interface ApplicationEndpointDTO {
    id: string;
    label: string;
    checkType: string;
    config: unknown;
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
    // Generous but bounded - an unreachable sibling app shouldn't hang this
    // request forever. Sibling apps are themselves on Render's free tier and
    // can need 30-50s to cold-start after being idle, so this has to clear
    // that comfortably or every "first click of the day" would read as a
    // false failure.
    public static readonly FETCH_TIMEOUT_MS = 60000;
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

        return applications.map((application) => ({
            id: application.id,
            slug: application.slug,
            name: application.name,
            baseUrl: application.baseUrl,
            iconName: application.iconName,
            endpoints: application.endpoints.map((endpoint) => ({
                id: endpoint.id,
                label: endpoint.label,
                checkType: endpoint.checkType,
                config: JSON.parse(endpoint.config) as unknown,
            })),
        }));
    }

    public async hitEndpoint(endpointId: string): Promise<EndpointHitResultDTO> {
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
        const url = `${endpoint.application.baseUrl}${config.path}`;

        const startedAt = Date.now();
        let result: EndpointHitResultDTO;

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), ApplicationMonitorCON.FETCH_TIMEOUT_MS);

            const response = await fetch(url, { method: config.method, signal: controller.signal });
            clearTimeout(timeout);

            const durationMs = Date.now() - startedAt;
            const rawBody = await response.text();
            let responseBody: unknown = rawBody;
            try {
                responseBody = JSON.parse(rawBody);
            } catch {
                // Not JSON - keep the raw text as-is.
            }

            result = {
                success: true,
                statusCode: response.status,
                responseBody,
                durationMs,
                errorMessage: null,
            };
        } catch (error) {
            result = {
                success: false,
                statusCode: null,
                responseBody: null,
                durationMs: Date.now() - startedAt,
                errorMessage: error instanceof Error ? error.message : String(error),
            };
        }

        await ApplicationDatabaseProvider.current.client.applicationEndpointHit.create({
            data: {
                endpointId: endpoint.id,
                success: result.success,
                statusCode: result.statusCode,
                responseBody: result.responseBody !== null ? JSON.stringify(result.responseBody) : null,
                durationMs: result.durationMs,
                errorMessage: result.errorMessage,
            },
        });

        return result;
    }
}
