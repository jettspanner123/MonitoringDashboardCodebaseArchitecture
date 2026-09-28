import type { FastifyInstance } from 'fastify';
import ApplicationRouteFactory from '../../Factories/ApplicationRouteFactory';
import EntityNotFoundCException from '../../Exceptions/EntityNotFoundCException';
import ApiResponseClass from '../../Models/Classes/ApiResponseClass';
import RunsService from './Services/RunsService';

export default async function RunsController(fastify: FastifyInstance): Promise<void> {
    fastify.get(ApplicationRouteFactory.current.runs.GET_ALL, async (_request, reply) => {
        const runs = await RunsService.current.listRuns();
        reply.send(ApiResponseClass.succeeded(runs, `${runs.length} run(s) found.`));
    });

    fastify.get<{ Params: { id: string } }>(ApplicationRouteFactory.current.runs.GET_BY_ID, async (request, reply) => {
        const run = await RunsService.current.getRunById(request.params.id);
        if (!run) {
            throw new EntityNotFoundCException(`No run found with id "${request.params.id}".`);
        }
        reply.send(ApiResponseClass.succeeded(run, 'Run found.'));
    });
}
