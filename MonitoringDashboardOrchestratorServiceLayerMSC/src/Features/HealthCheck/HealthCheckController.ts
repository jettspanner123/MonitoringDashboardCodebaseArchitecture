import type { FastifyInstance } from 'fastify';
import ApplicationRouteFactory from '../../Factories/ApplicationRouteFactory';
import ApiResponseClass from '../../Models/Classes/ApiResponseClass';
import HealthCheckService from './Services/HealthCheckService';

export default async function HealthCheckController(fastify: FastifyInstance): Promise<void> {
    fastify.get(ApplicationRouteFactory.current.healthCheck.PING, async (_request, reply) => {
        reply.send(
            ApiResponseClass.succeeded({ status: 'PONG', timestamp: new Date().toISOString() }, 'Liveness probe succeeded.')
        );
    });

    fastify.get(ApplicationRouteFactory.current.healthCheck.STATUS, async (_request, reply) => {
        const report = await HealthCheckService.current.checkHealth();
        const statusCode = report.status === 'Healthy' ? 200 : 503;
        const message = report.status === 'Healthy' ? 'All systems operational.' : 'Database unreachable.';

        reply.status(statusCode).send(ApiResponseClass.succeeded(report, message, statusCode));
    });
}
