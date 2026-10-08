import React, { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import PushSubscriptionService from '../../Services/PushSubscriptionService';

// Self-contained - owns its own subscribed/loading/error state, same as
// ThemeToggleSharedComponent and friends. There's no login system, so "on"
// just means "this browser is subscribed", not "this person is".
export default function NotificationBellToggleSharedComponent(): React.JSX.Element | null {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isBusy, setIsBusy] = useState<boolean>(false);

  useEffect(() => {
    const supported = PushSubscriptionService.current.isSupported();
    setIsSupported(supported);
    if (!supported) return;

    PushSubscriptionService.current
      .getExistingSubscription()
      .then((subscription) => setIsSubscribed(subscription !== null))
      .catch(() => setIsSubscribed(false));
  }, []);

  if (!isSupported) return null;

  const handleToggle = async (): Promise<void> => {
    setIsBusy(true);
    try {
      if (isSubscribed) {
        await PushSubscriptionService.current.unsubscribe();
        setIsSubscribed(false);
      } else {
        await PushSubscriptionService.current.subscribe();
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error('Failed to toggle push notifications:', error);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleToggle()}
      disabled={isBusy}
      title={isSubscribed ? 'Disable failed-run push notifications' : 'Enable failed-run push notifications'}
      className={`h-10 w-10 sm:h-9 sm:w-9 rounded-xl sm:rounded-lg hairline-border transition-colors cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-50 ${
        isSubscribed
          ? 'bg-[#0C2086]/10 text-[#0C2086] dark:bg-sky-950/40 dark:text-sky-400'
          : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700/80'
      }`}
    >
      {isSubscribed ? <Bell className="w-4.5 h-4.5" /> : <BellOff className="w-4.5 h-4.5" />}
    </button>
  );
}
