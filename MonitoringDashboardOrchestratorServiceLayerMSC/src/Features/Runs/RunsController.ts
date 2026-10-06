import type { FastifyInstance } from 'fastify';
import { Environment } from '@prisma/client';
import ApplicationRouteFactory from '../../Factories/ApplicationRouteFactory';
import EntityNotFoundCException from '../../Exceptions/EntityNotFoundCException';
import ValidationCException from '../../Exceptions/ValidationCException';
import ApiResponseClass from '../../Models/Classes/ApiResponseClass';
import RunsService from './Services/RunsService';
import RunTriggerService from './Services/RunTriggerService';
import RunLiveProgressService from './Services/RunLiveProgressService';

class RunsValidationCON {
    public static readonly VALID_ENVIRONMENTS = Object.values(Environment);
}

export default async function RunsController(fastify: FastifyInstance): Promise<void> {
    fastify.get<{ Querystring: { environment?: string } }>(
        ApplicationRouteFactory.current.runs.GET_ALL,
        async (request, reply) => {
            const { environment } = request.query;

            if (environment !== undefined && !RunsValidationCON.VALID_ENVIRONMENTS.includes(environment as Environment)) {
                throw new ValidationCException(
                    `Invalid environment "${environment}". Expected one of: ${RunsValidationCON.VALID_ENVIRONMENTS.join(', ')}.`
                );
            }

            const runs = await RunsService.current.listRuns(environment as Environment | undefined);
            reply.send(ApiResponseClass.succeeded(runs, `${runs.length} run(s) found.`));
        }
    );

    fastify.get<{ Params: { id: string } }>(ApplicationRouteFactory.current.runs.GET_BY_ID, async (request, reply) => {
        const run = await RunsService.current.getRunById(request.params.id);
        if (!run) {
            throw new EntityNotFoundCException(`No run found with id "${request.params.id}".`);
        }
        reply.send(ApiResponseClass.succeeded(run, 'Run found.'));
    });

    fastify.post<{ Body: { environment?: string } }>(
        ApplicationRouteFactory.current.runs.TRIGGER,
        async (request, reply) => {
            const { environment } = request.body ?? {};

            if (!environment || !RunsValidationCON.VALID_ENVIRONMENTS.includes(environment as Environment)) {
                throw new ValidationCException(
                    `Invalid environment "${environment}". Expected one of: ${RunsValidationCON.VALID_ENVIRONMENTS.join(', ')}.`
                );
            }

            const testRunId = await RunTriggerService.current.triggerRun(environment as Environment);
            reply.send(ApiResponseClass.succeeded({ testRunId }, 'Smoke test triggered.'));
        }
    );

    fastify.get<{ Params: { testRunId: string } }>(
        ApplicationRouteFactory.current.runs.LIVE,
        { websocket: true },
        (socket, request) => {
            const { testRunId } = request.params;
            const stopPolling = RunLiveProgressService.current.startPolling(testRunId, (snapshot) => {
                socket.send(JSON.stringify(snapshot));
            });
            socket.on('close', () => stopPolling());
        }
    );
}
