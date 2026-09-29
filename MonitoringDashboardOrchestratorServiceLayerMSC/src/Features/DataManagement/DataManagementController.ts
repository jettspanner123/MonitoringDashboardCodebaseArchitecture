import type { FastifyInstance } from 'fastify';
import ApplicationRouteFactory from '../../Factories/ApplicationRouteFactory';
import ApiResponseClass from '../../Models/Classes/ApiResponseClass';
import DataManagementService from './Services/DataManagementService';

export default async function DataManagementController(fastify: FastifyInstance): Promise<void> {
    fastify.delete(ApplicationRouteFactory.current.dataManagement.WIPE_ALL, async (_request, reply) => {
        await DataManagementService.current.wipeAllData();
        reply.send(ApiResponseClass.succeeded(null, 'All test data has been deleted.'));
    });
}
