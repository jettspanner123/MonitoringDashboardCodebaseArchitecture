import type { FastifyInstance } from 'fastify';
import ApplicationRouteFactory from '../../Factories/ApplicationRouteFactory';
import ApiResponseClass from '../../Models/Classes/ApiResponseClass';
import ValidationCException from '../../Exceptions/ValidationCException';
import PushNotificationService from './Services/PushNotificationService';

export default async function NotificationsController(fastify: FastifyInstance): Promise<void> {
    fastify.get(ApplicationRouteFactory.current.notifications.GET_VAPID_PUBLIC_KEY, async (_request, reply) => {
        reply.send(
            ApiResponseClass.succeeded(
                { publicKey: PushNotificationService.current.getVapidPublicKey() },
                'VAPID public key retrieved.'
            )
        );
    });

    fastify.post<{ Body: { endpoint?: string; keys?: { p256dh?: string; auth?: string } } }>(
        ApplicationRouteFactory.current.notifications.SUBSCRIBE,
        async (request, reply) => {
            const { endpoint, keys } = request.body ?? {};

            if (!endpoint || !keys?.p256dh || !keys?.auth) {
                throw new ValidationCException(
                    'A valid push subscription (endpoint, keys.p256dh, keys.auth) is required.'
                );
            }

            await PushNotificationService.current.subscribe({ endpoint, p256dh: keys.p256dh, auth: keys.auth });
            reply.send(ApiResponseClass.succeeded(null, 'Subscribed successfully.'));
        }
    );

    fastify.delete<{ Body: { endpoint?: string } }>(
        ApplicationRouteFactory.current.notifications.UNSUBSCRIBE,
        async (request, reply) => {
            const { endpoint } = request.body ?? {};

            if (!endpoint) {
                throw new ValidationCException('An endpoint is required.');
            }

            await PushNotificationService.current.unsubscribe(endpoint);
            reply.send(ApiResponseClass.succeeded(null, 'Unsubscribed successfully.'));
        }
    );

    fastify.post(ApplicationRouteFactory.current.notifications.CHECK_AND_NOTIFY, async (_request, reply) => {
        const result = await PushNotificationService.current.checkAndNotify();
        reply.send(ApiResponseClass.succeeded(result, 'Check complete.'));
    });
}
