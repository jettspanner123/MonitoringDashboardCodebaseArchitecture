import type { FastifyInstance } from 'fastify';
import ApplicationRouteFactory from '../../Factories/ApplicationRouteFactory';
import ApiResponseClass from '../../Models/Classes/ApiResponseClass';
import EntityNotFoundCException from '../../Exceptions/EntityNotFoundCException';
import ValidationCException from '../../Exceptions/ValidationCException';
import ApplicationMonitorService from './Services/ApplicationMonitorService';
import ApplicationEndpointHitAttemptTrackerService from './Services/ApplicationEndpointHitAttemptTrackerService';

export default async function ApplicationMonitorController(fastify: FastifyInstance): Promise<void> {
    fastify.get(ApplicationRouteFactory.current.applicationMonitor.GET_APPLICATIONS, async (_request, reply) => {
        try {
            const applications = await ApplicationMonitorService.current.getApplications();
            reply.send(ApiResponseClass.succeeded(applications, 'Applications retrieved successfully.'));
        } catch (error) {
            reply.send(
                ApiResponseClass.failed(
                    'An unexpected error occurred while retrieving applications.',
                    [error instanceof Error ? error.message : String(error)],
                    500
                )
            );
        }
    });

    fastify.post<{ Params: { id: string } }>(
        ApplicationRouteFactory.current.applicationMonitor.HIT_ENDPOINT,
        async (request, reply) => {
            try {
                const hitAttemptId = await ApplicationMonitorService.current.startHit(request.params.id);
                reply.send(ApiResponseClass.succeeded({ hitAttemptId }, 'Endpoint hit started.'));
            } catch (error) {
                if (error instanceof EntityNotFoundCException) {
                    reply.status(404).send(ApiResponseClass.failed(error.message, [error.message], 404));
                    return;
                }
                if (error instanceof ValidationCException) {
                    reply.status(400).send(ApiResponseClass.failed(error.message, error.validationErrors, 400));
                    return;
                }
                reply.send(
                    ApiResponseClass.failed(
                        'An unexpected error occurred while starting the endpoint hit.',
                        [error instanceof Error ? error.message : String(error)],
                        500
                    )
                );
            }
        }
    );

    fastify.get<{ Params: { hitAttemptId: string } }>(
        ApplicationRouteFactory.current.applicationMonitor.HIT_LIVE,
        { websocket: true },
        (socket, request) => {
            const { hitAttemptId } = request.params;
            const stopPolling = ApplicationEndpointHitAttemptTrackerService.current.startPolling(hitAttemptId, (snapshot) => {
                socket.send(JSON.stringify(snapshot));
            });
            socket.on('close', () => stopPolling());
        }
    );
}
