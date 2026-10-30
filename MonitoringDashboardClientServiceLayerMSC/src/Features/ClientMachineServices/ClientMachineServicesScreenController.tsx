import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RotateCw, Search, WifiOff } from 'lucide-react';
import EmptyStateSharedComponent from '../../Shared/Components/EmptyStateSharedComponent';
import ButtonSharedComponent from '../../Shared/Components/ButtonSharedComponent';
import PrimaryActionButtonSharedComponent from '../../Shared/Components/PrimaryActionButtonSharedComponent';
import ClientMachineAddServiceModalSharedComponent from '../../Shared/Components/ClientMachineAddServiceModalSharedComponent';
import ClientMachineMachineSectionComponent from './Components/ClientMachineMachineSectionComponent';
import TanstackQueryClientService from '../../Services/TanstackQueryClientService';
import TanstackQueryKeysCON from '../../Constants/TanstackQueryKeysCON';

class ClientMachineServicesScreenCON {
  public static readonly TITLE = 'Client Machines';
}

export default function ClientMachineServicesScreenController(): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const {
    data: isRelayConnected,
    isLoading: isLoadingRelayStatus,
    refetch: refetchRelayStatus,
    isFetching: isRefetchingRelayStatus,
  } = TanstackQueryClientService.current.clientMachineServices.useRelayStatusQuery();

  const { data: machines = [], isLoading: isLoadingMachines } =
    TanstackQueryClientService.current.clientMachineServices.useMachinesQuery(Boolean(isRelayConnected));

  const handleServiceAdded = (machineId: string): void => {
    void queryClient.invalidateQueries({ queryKey: TanstackQueryKeysCON.clientMachineCuratedServices(machineId) });
    void queryClient.invalidateQueries({ queryKey: TanstackQueryKeysCON.clientMachineAllServices(machineId) });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif-headline tracking-tight text-slate-900 dark:text-zinc-100 leading-tight">
            {ClientMachineServicesScreenCON.TITLE}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1.5 max-w-2xl">
            Monitor and control Windows services on registered client machines over the relay.{' '}
            {isLoadingRelayStatus ? (
              'Checking relay status…'
            ) : isRelayConnected ? (
              'Live service status is available right now.'
            ) : (
              <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                <WifiOff className="w-3.5 h-3.5" /> Relay offline
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search services…"
              className="h-9 pl-9 pr-3 text-xs rounded-lg bg-slate-50 dark:bg-[#0a0a0c] text-slate-900 dark:text-zinc-100 border border-slate-200/80 dark:border-zinc-800 focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-colors w-56 sm:w-80"
            />
          </div>
          <ButtonSharedComponent
            variant="outline"
            size="md"
            onClick={() => void refetchRelayStatus()}
            isLoading={isRefetchingRelayStatus}
            ariaLabel="Refresh"
            title="Refresh"
            icon={<RotateCw className="w-3.5 h-3.5" />}
          />
          <PrimaryActionButtonSharedComponent
            label="Add Service"
            size="md"
            onClick={() => setIsAddServiceModalOpen(true)}
          />
        </div>
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
          machines.map((machine) => (
            <ClientMachineMachineSectionComponent key={machine.id} machine={machine} searchQuery={searchQuery} />
          ))
        ))}

      <ClientMachineAddServiceModalSharedComponent
        isOpen={isAddServiceModalOpen}
        onClose={() => setIsAddServiceModalOpen(false)}
        machines={machines}
        onAdded={handleServiceAdded}
      />
    </div>
  );
}
