import type { FastifyInstance } from 'fastify';
import { Environment } from '@prisma/client';
import ApplicationRouteFactory from '../../Factories/ApplicationRouteFactory';
import EntityNotFoundCException from '../../Exceptions/EntityNotFoundCException';
import ValidationCException from '../../Exceptions/ValidationCException';
import ApiResponseClass from '../../Models/Classes/ApiResponseClass';
import ReportsService from './Services/ReportsService';

class ReportsValidationCON {
    public static readonly VALID_ENVIRONMENTS = Object.values(Environment);

    // Query/body dates arrive as bare "YYYY-MM-DD" strings, which `new Date(...)`
    // parses as UTC midnight - correct as a lower bound, but as an upper bound it
    // silently excludes every check recorded later that same day. Widening the
    // end-of-range date to the last instant of its UTC day fixes that for every
    // "lte" comparison below (day-completeness's monthEnd, available-categories'
    // and generate's endDate).
    public static toEndOfUtcDay(date: Date): Date {
        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);
        return endOfDay;
    }
}

function parseIsoDate(value: unknown, fieldName: string): Date {
    if (typeof value !== 'string') {
        throw new ValidationCException(`"${fieldName}" is required.`);
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new ValidationCException(`"${fieldName}" is not a valid date: "${value}".`);
    }
    return parsed;
}

function parseEnvironment(value: unknown): Environment {
    if (typeof value !== 'string' || !ReportsValidationCON.VALID_ENVIRONMENTS.includes(value as Environment)) {
        throw new ValidationCException(
            `Invalid environment "${String(value)}". Expected one of: ${ReportsValidationCON.VALID_ENVIRONMENTS.join(', ')}.`
        );
    }
    return value as Environment;
}

export default async function ReportsController(fastify: FastifyInstance): Promise<void> {
    fastify.get<{ Querystring: { environment?: string; monthStart?: string; monthEnd?: string } }>(
        ApplicationRouteFactory.current.reports.DAY_COMPLETENESS,
        async (request, reply) => {
            const environment = parseEnvironment(request.query.environment);
            const monthStart = parseIsoDate(request.query.monthStart, 'monthStart');
            const monthEnd = ReportsValidationCON.toEndOfUtcDay(parseIsoDate(request.query.monthEnd, 'monthEnd'));

            const completeness = await ReportsService.current.getDayCompleteness(environment, monthStart, monthEnd);
            reply.send(ApiResponseClass.succeeded(completeness, 'Day completeness computed.'));
        }
    );

    fastify.get<{ Querystring: { environment?: string; startDate?: string; endDate?: string } }>(
        ApplicationRouteFactory.current.reports.AVAILABLE_CATEGORIES,
        async (request, reply) => {
            const environment = parseEnvironment(request.query.environment);
            const startDate = parseIsoDate(request.query.startDate, 'startDate');
            const endDate = ReportsValidationCON.toEndOfUtcDay(parseIsoDate(request.query.endDate, 'endDate'));

            const categories = await ReportsService.current.getAvailableCategories(environment, startDate, endDate);
            reply.send(ApiResponseClass.succeeded(categories, 'Available categories found.'));
        }
    );

    fastify.post<{ Body: { environment?: string; startDate?: string; endDate?: string; selectedKeys?: string[] } }>(
        ApplicationRouteFactory.current.reports.GENERATE,
        async (request, reply) => {
            const environment = parseEnvironment(request.body?.environment);
            const startDate = parseIsoDate(request.body?.startDate, 'startDate');
            const endDate = ReportsValidationCON.toEndOfUtcDay(parseIsoDate(request.body?.endDate, 'endDate'));
            const selectedKeys = request.body?.selectedKeys;

            if (startDate > endDate) {
                throw new ValidationCException('"startDate" must not be after "endDate".');
            }
            if (!Array.isArray(selectedKeys) || selectedKeys.length === 0) {
                throw new ValidationCException('"selectedKeys" must be a non-empty array.');
            }

            const reportId = await ReportsService.current.generateReport({ environment, startDate, endDate, selectedKeys });
            reply.send(ApiResponseClass.succeeded({ reportId }, 'Report generated.'));
        }
    );

    fastify.get<{ Params: { reportId: string } }>(ApplicationRouteFactory.current.reports.GET_BY_ID, async (request, reply) => {
        const report = await ReportsService.current.getReportById(request.params.reportId);
        if (!report) {
            throw new EntityNotFoundCException(`No report found with id "${request.params.reportId}".`);
        }
        reply.send(ApiResponseClass.succeeded(report, 'Report found.'));
    });
}
