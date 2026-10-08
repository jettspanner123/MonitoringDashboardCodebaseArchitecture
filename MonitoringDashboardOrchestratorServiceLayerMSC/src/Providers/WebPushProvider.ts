import webpush from 'web-push';

export default class WebPushProvider {
    public static current = new WebPushProvider();

    public readonly client: typeof webpush = webpush;

    private constructor() {
        this.client.setVapidDetails(
            process.env.VAPID_SUBJECT ?? 'mailto:uddeshya.singh@theweplm.com',
            process.env.VAPID_PUBLIC_KEY ?? '',
            process.env.VAPID_PRIVATE_KEY ?? ''
        );
    }
}
