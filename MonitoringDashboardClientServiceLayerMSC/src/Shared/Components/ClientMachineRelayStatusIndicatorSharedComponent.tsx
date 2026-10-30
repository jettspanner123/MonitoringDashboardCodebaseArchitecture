import React from 'react';
import { Radio } from 'lucide-react';
import TanstackQueryClientService from '../../Services/TanstackQueryClientService';

// Ambient, always-visible indicator (unlike the Client Machines page's own
// one-shot relay check) - polled in the background so it reflects live
// connectivity even when the user isn't on that page at all.
export default function ClientMachineRelayStatusIndicatorSharedComponent(): React.JSX.Element {
  const { data: isConnected } = TanstackQueryClientService.current.clientMachineServices.useRelayStatusQuery();

  return (
    <div
      title={
        isConnected
          ? 'Client Machines relay: at least one instance connected'
          : 'Client Machines relay: offline'
      }
      className="relative h-10 w-10 sm:h-9 sm:w-9 rounded-xl sm:rounded-lg hairline-border bg-slate-100 dark:bg-zinc-800/80 flex items-center justify-center shrink-0"
    >
      <Radio className="w-4.5 h-4.5 text-slate-700 dark:text-zinc-300" />
      <span
        className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-white dark:ring-[#0c0c0e] ${
          isConnected ? 'bg-emerald-500' : 'bg-rose-500'
        }`}
      />
    </div>
  );
}
