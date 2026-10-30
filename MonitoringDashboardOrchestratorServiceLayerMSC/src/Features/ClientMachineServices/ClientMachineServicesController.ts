import type { FastifyInstance, FastifyRequest } from 'fastify';
import ApplicationRouteFactory from '../../Factories/ApplicationRouteFactory';
import ApiResponseClass from '../../Models/Classes/ApiResponseClass';
import ValidationCException from '../../Exceptions/ValidationCException';
import ClientMachineAuthService from './Services/ClientMachineAuthService';
import ClientMachineServicesService, { type ClientMachineServiceAction } from './Services/ClientMachineServicesService';
import ClientMachineRelayPoolService from './Services/ClientMachineRelayPoolService';
import ClientMachineServiceActionTrackerService from './Services/ClientMachineServiceActionTrackerService';

class ClientMachineServicesAuthHelper {
    public static requireUsernameFromAuthHeader(request: FastifyRequest): string {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ValidationCException('Missing or invalid Authorization header.');
        }
        const accessToken = authHeader.slice('Bearer '.length);
        return ClientMachineAuthService.current.verifyAccessToken(accessToken).username;
    }
}

export default async function ClientMachineServicesController(fastify: FastifyInstance): Promise<void> {
    const ROUTES = ApplicationRouteFactory.current.clientMachineServices;

    fastify.post<{ Body: { username?: string; password?: string } }>(ROUTES.LOGIN, async (request, reply) => {
        const { username, password } = request.body ?? {};
        if (!username || !password) {
            throw new ValidationCException('Both username and password are required.');
        }
        const tokens = await ClientMachineAuthService.current.login(username, password);
        reply.send(ApiResponseClass.succeeded(tokens, 'Logged in successfully.'));
    });

    fastify.post<{ Body: { refreshToken?: string } }>(ROUTES.REFRESH, async (request, reply) => {
        const { refreshToken } = request.body ?? {};
        if (!refreshToken) {
            throw new ValidationCException('refreshToken is required.');
        }
        const tokens = await ClientMachineAuthService.current.refresh(refreshToken);
        reply.send(ApiResponseClass.succeeded(tokens, 'Session refreshed.'));
    });

    fastify.get(ROUTES.RELAY_STATUS, async (_request, reply) => {
        const isConnected = ClientMachineRelayPoolService.current.isAnyRelayConnected();
        reply.send(ApiResponseClass.succeeded({ isConnected }, 'Relay status retrieved.'));
    });

    fastify.get(ROUTES.GET_MACHINES, async (request, reply) => {
        ClientMachineServicesAuthHelper.requireUsernameFromAuthHeader(request);
        const machines = await ClientMachineServicesService.current.getMachines();
        reply.send(ApiResponseClass.succeeded(machines, 'Machines retrieved.'));
    });

    fastify.get<{ Params: { machineId: string } }>(ROUTES.GET_CURATED_SERVICES, async (request, reply) => {
        const username = ClientMachineServicesAuthHelper.requireUsernameFromAuthHeader(request);
        const services = await ClientMachineServicesService.current.getCuratedServices(request.params.machineId, username);
        reply.send(ApiResponseClass.succeeded(services, 'Curated services retrieved.'));
    });

    fastify.get<{ Params: { machineId: string } }>(ROUTES.GET_ALL_SERVICES, async (request, reply) => {
        const username = ClientMachineServicesAuthHelper.requireUsernameFromAuthHeader(request);
        const services = await ClientMachineServicesService.current.getAllServices(request.params.machineId, username);
        reply.send(ApiResponseClass.succeeded(services, 'All services retrieved.'));
    });

    fastify.post<{ Params: { machineId: string; serviceName: string }; Body: { action?: ClientMachineServiceAction } }>(
        ROUTES.START_ACTION,
        async (request, reply) => {
            const username = ClientMachineServicesAuthHelper.requireUsernameFromAuthHeader(request);
            const { action } = request.body ?? {};
            if (action !== 'Start' && action !== 'Stop' && action !== 'Restart') {
                throw new ValidationCException('action must be one of "Start", "Stop", or "Restart".');
            }
            const actionAttemptId = await ClientMachineServicesService.current.startAction(
                request.params.machineId,
                request.params.serviceName,
                action,
                username
            );
            reply.send(ApiResponseClass.succeeded({ actionAttemptId }, 'Action started.'));
        }
    );

    fastify.get<{ Params: { actionAttemptId: string } }>(
        ROUTES.ACTION_LIVE,
        { websocket: true },
        (socket, request) => {
            const { actionAttemptId } = request.params;
            const stopPolling = ClientMachineServiceActionTrackerService.current.startPolling(actionAttemptId, (snapshot) => {
                socket.send(JSON.stringify(snapshot));
            });
            socket.on('close', () => stopPolling());
        }
    );

    // The relay's own persistent connection. Not a route a browser ever
    // calls - authenticated via RELAY_SHARED_SECRET (query param, since it's
    // simplest to always have available during a websocket upgrade) rather
    // than the JWT used everywhere else in this controller, which has
    // nothing to do with the VM login credentials - see the PRD's section 3.
    fastify.get<{ Querystring: { secret?: string } }>(
        ROUTES.RELAY_CONNECT,
        { websocket: true },
        (socket, request) => {
            const expectedSecret = process.env.RELAY_SHARED_SECRET;
            if (!expectedSecret || request.query.secret !== expectedSecret) {
                socket.close();
                return;
            }

            const connectionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            ClientMachineRelayPoolService.current.registerRelay(connectionId, socket);

            socket.on('message', (rawMessage: Buffer | string) => {
                ClientMachineRelayPoolService.current.handleRelayMessage(rawMessage.toString());
            });

            socket.on('close', () => {
                ClientMachineRelayPoolService.current.unregisterRelay(connectionId);
            });
        }
    );
}
