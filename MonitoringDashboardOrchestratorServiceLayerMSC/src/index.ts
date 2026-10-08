import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import ApplicationRouteFactory from './Factories/ApplicationRouteFactory';
import GlobalExceptionHandlingMiddleware from './Middlewares/GlobalExceptionHandlingMiddleware';
import HealthCheckController from './Features/HealthCheck/HealthCheckController';
import RunsController from './Features/Runs/RunsController';
import DataManagementController from './Features/DataManagement/DataManagementController';
import NotificationsController from './Features/Notifications/NotificationsController';
import ApplicationDatabaseProvider from './Providers/ApplicationDatabaseProvider';

async function bootstrap(): Promise<void> {
    const fastify = Fastify({ logger: true });

    await fastify.register(cors, {
        origin: process.env.CORS_ORIGIN ?? true,
    });
    // Must be registered before any routes - it intercepts the upgrade
    // request for routes declared with { websocket: true }.
    await fastify.register(websocket);

    fastify.setErrorHandler(GlobalExceptionHandlingMiddleware);

    await fastify.register(HealthCheckController, { prefix: ApplicationRouteFactory.current.healthCheck.CONTROLLER_URL });
    await fastify.register(RunsController, { prefix: ApplicationRouteFactory.current.runs.CONTROLLER_URL });
    await fastify.register(DataManagementController, { prefix: ApplicationRouteFactory.current.dataManagement.CONTROLLER_URL });
    await fastify.register(NotificationsController, { prefix: ApplicationRouteFactory.current.notifications.CONTROLLER_URL });

    const port = Number(process.env.PORT ?? 4000);
    await fastify.listen({ port, host: '0.0.0.0' });
}

bootstrap().catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', error);
    await ApplicationDatabaseProvider.current.disconnect();
    process.exit(1);
});
