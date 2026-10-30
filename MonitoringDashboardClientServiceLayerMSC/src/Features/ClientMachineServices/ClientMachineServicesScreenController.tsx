import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wifi, WifiOff } from 'lucide-react';
import EmptyStateSharedComponent from '../../Shared/Components/EmptyStateSharedComponent';
import ButtonSharedComponent from '../../Shared/Components/ButtonSharedComponent';
import ClientMachineMachineSectionComponent from './Components/ClientMachineMachineSectionComponent';
import ClientMachineAuthService from '../../Services/ClientMachineAuthService';
import TanstackQueryClientService from '../../Services/TanstackQueryClientService';

class ClientMachineServicesScreenCON {
  public static readonly TITLE = 'Client Machines';
  public static readonly RELAY_STATUS_QUERY_KEY: string[] = ['client-machine-services', 'relay-status'];
}

export default function ClientMachineServicesScreenController(): React.JSX.Element {
  const {
    data: isRelayConnected,
    isLoading: isLoadingRelayStatus,
    refetch: refetchRelayStatus,
    isFetching: isRefetchingRelayStatus,
  } = useQuery({
    queryKey: ClientMachineServicesScreenCON.RELAY_STATUS_QUERY_KEY,
    queryFn: () => ClientMachineAuthService.current.getRelayStatus(),
    staleTime: 0,
  });

  const { data: machines = [], isLoading: isLoadingMachines } =
    TanstackQueryClientService.current.clientMachineServices.useMachinesQuery(Boolean(isRelayConnected));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif-headline tracking-tight text-slate-900 dark:text-zinc-100 leading-tight">
            {ClientMachineServicesScreenCON.TITLE}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1.5 max-w-2xl flex items-center gap-2">
            {isLoadingRelayStatus ? (
              <span className="text-slate-400 dark:text-zinc-500">Checking relay status…</span>
            ) : isRelayConnected ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <Wifi className="w-3.5 h-3.5" /> Relay connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                <WifiOff className="w-3.5 h-3.5" /> Relay offline
              </span>
            )}
          </p>
        </div>
        <ButtonSharedComponent
          variant="outline"
          size="sm"
          onClick={() => void refetchRelayStatus()}
          isLoading={isRefetchingRelayStatus}
        >
          Refresh
        </ButtonSharedComponent>
      </div>

      {!isLoadingRelayStatus && !isRelayConnected && (
        <EmptyStateSharedComponent
          icon={<WifiOff className="w-6 h-6" />}
          title="Service Control Is Currently Offline"
          description="No relay is currently connected. This feature is unavailable until at least one of the team's relay instances reconnects."
          className="w-full py-12"
        />
      )}

      {isRelayConnected &&
        (isLoadingMachines ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((placeholderKey) => (
              <div key={placeholderKey} className="h-32 rounded-xl bg-slate-100 dark:bg-zinc-800/60 animate-pulse" />
            ))}
          </div>
        ) : (
          machines.map((machine) => <ClientMachineMachineSectionComponent key={machine.id} machine={machine} />)
        ))}
    </div>
  );
}
