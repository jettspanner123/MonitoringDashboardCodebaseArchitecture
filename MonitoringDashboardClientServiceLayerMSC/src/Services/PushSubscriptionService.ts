import ApplicationNetworkAPIConfiguration from '../Configurations/ApplicationNetworkAPIConfiguration';
import type { ApiResponseType } from '../Types';

// Converts the VAPID public key (URL-safe base64, as the backend/web-push
// convention hands it over) into the raw Uint8Array the Push API itself
// requires for `applicationServerKey`.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default class PushSubscriptionService {
  public static current = new PushSubscriptionService();

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Null means "not subscribed" (or unsupported) - callers treat both the
  // same way for UI purposes (show the "enable" state).
  public async getExistingSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported()) return null;
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!registration) return null;
    return registration.pushManager.getSubscription();
  }

  public async subscribe(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser.');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission was not granted.');
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const { publicKey } = await this.fetchVapidPublicKey();
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      throw new Error('The browser returned an incomplete push subscription.');
    }

    const response = await fetch(`${ApplicationNetworkAPIConfiguration.BASE_URL}/api/v1/notifications/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      }),
    });
    const body: ApiResponseType<null> = await response.json();
    if (!body.success) {
      throw new Error(body.message || 'Failed to register the push subscription.');
    }
  }

  public async unsubscribe(): Promise<void> {
    const subscription = await this.getExistingSubscription();
    if (!subscription) return;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    await fetch(`${ApplicationNetworkAPIConfiguration.BASE_URL}/api/v1/notifications/subscribe`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    }).catch(() => {
      // Best-effort - the browser-side unsubscribe above already succeeded,
      // which is what actually stops this device from receiving pushes.
    });
  }

  private async fetchVapidPublicKey(): Promise<{ publicKey: string }> {
    const response = await fetch(`${ApplicationNetworkAPIConfiguration.BASE_URL}/api/v1/notifications/vapid-public-key`);
    const body: ApiResponseType<{ publicKey: string }> = await response.json();
    if (!body.success || !body.data) {
      throw new Error(body.message || 'Failed to fetch the VAPID public key.');
    }
    return body.data;
  }
}
