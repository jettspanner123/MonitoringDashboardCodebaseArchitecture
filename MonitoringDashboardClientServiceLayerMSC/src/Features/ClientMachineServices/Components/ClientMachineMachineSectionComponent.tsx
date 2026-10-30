import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ServerOff } from 'lucide-react';
import ButtonSharedComponent from '../../../Shared/Components/ButtonSharedComponent';
import EmptyStateSharedComponent from '../../../Shared/Components/EmptyStateSharedComponent';
import ClientMachineServiceCardSharedComponent from '../../../Shared/Components/ClientMachineServiceCardSharedComponent';
import TanstackQueryClientService from '../../../Services/TanstackQueryClientService';
import TanstackQueryKeysCON from '../../../Constants/TanstackQueryKeysCON';
import type { ClientMachine } from '../../../Types';

export interface ClientMachineMachineSectionComponentProps {
  machine: ClientMachine;
}

export default function ClientMachineMachineSectionComponent({
  machine,
}: ClientMachineMachineSectionComponentProps): React.JSX.Element {
  const [showAllServices, setShowAllServices] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const queryClient = useQueryClient();

  const curatedQuery = TanstackQueryClientService.current.clientMachineServices.useCuratedServicesQuery(
    machine.id,
    !showAllServices
  );
  const allServicesQuery = TanstackQueryClientService.current.clientMachineServices.useAllServicesQuery(
    machine.id,
    showAllServices
  );

  const activeQuery = showAllServices ? allServicesQuery : curatedQuery;
  const services = activeQuery.data ?? [];
  const visibleServices =
    showAllServices && searchQuery.trim()
      ? services.filter((service) => service.serviceName.toLowerCase().includes(searchQuery.trim().toLowerCase()))
      : services;

  const handleActionSettled = (): void => {
    void queryClient.invalidateQueries({ queryKey: TanstackQueryKeysCON.clientMachineCuratedServices(machine.id) });
    void queryClient.invalidateQueries({ queryKey: TanstackQueryKeysCON.clientMachineAllServices(machine.id) });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono">
          {machine.nickname}
        </h2>
        <div className="flex items-center gap-2">
          {showAllServices && (
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search services…"
              className="h-8 px-3 text-xs rounded-lg bg-slate-50 dark:bg-[#0a0a0c] text-slate-900 dark:text-zinc-100 border border-slate-200/80 dark:border-zinc-800 focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-colors"
            />
          )}
          <ButtonSharedComponent
            variant={showAllServices ? 'primary' : 'outline'}
            size="sm"
            onClick={() => {
              setShowAllServices((prev) => !prev);
              setSearchQuery('');
            }}
          >
            {showAllServices ? 'Show Defaults' : 'Show All Services'}
          </ButtonSharedComponent>
        </div>
      </div>

      {activeQuery.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((placeholderKey) => (
            <div key={placeholderKey} className="h-32 rounded-xl bg-slate-100 dark:bg-zinc-800/60 animate-pulse" />
          ))}
        </div>
      ) : visibleServices.length === 0 ? (
        <EmptyStateSharedComponent
          icon={<ServerOff className="w-6 h-6" />}
          title="No Services"
          description={
            showAllServices
              ? 'No services matched your search.'
              : `No default services are configured for ${machine.nickname} yet.`
          }
          className="w-full py-8"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleServices.map((service) => (
            <ClientMachineServiceCardSharedComponent
              key={service.serviceName}
              machineId={machine.id}
              status={service}
              onActionSettled={handleActionSettled}
            />
          ))}
        </div>
      )}
    </div>
  );
}
