import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ServerOff } from 'lucide-react';
import ButtonSharedComponent from '../../../Shared/Components/ButtonSharedComponent';
import EmptyStateSharedComponent from '../../../Shared/Components/EmptyStateSharedComponent';
import ClientMachineServiceCardSharedComponent from '../../../Shared/Components/ClientMachineServiceCardSharedComponent';
import TanstackQueryClientService from '../../../Services/TanstackQueryClientService';
import TanstackQueryKeysCON from '../../../Constants/TanstackQueryKeysCON';
import ClientMachineUserAddedServicesUtility from '../../../Utilities/ClientMachineUserAddedServicesUtility';
import type { ClientMachine, ClientMachineServiceStatus } from '../../../Types';

export interface ClientMachineMachineSectionComponentProps {
  machine: ClientMachine;
  // Owned by the page header now - filters whichever list (curated or all)
  // is currently active for this machine, per the confirmed design.
  searchQuery: string;
}

export default function ClientMachineMachineSectionComponent({
  machine,
  searchQuery,
}: ClientMachineMachineSectionComponentProps): React.JSX.Element {
  const [showAllServices, setShowAllServices] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const curatedQuery = TanstackQueryClientService.current.clientMachineServices.useCuratedServicesQuery(
    machine.id,
    !showAllServices
  );
  const allServicesQuery = TanstackQueryClientService.current.clientMachineServices.useAllServicesQuery(
    machine.id,
    showAllServices
  );

  // Frontend-only "also track this" list (never written to
  // MD_ConfigurationConstantTBL) - while in curated mode, the only way to
  // get live status for one of these names is to pull the full list once
  // and pick the matching entries out of it.
  const userAddedServiceNames = ClientMachineUserAddedServicesUtility.current.getForMachine(machine.id);
  const needsMergeLookup = !showAllServices && userAddedServiceNames.length > 0;
  const mergeLookupQuery = TanstackQueryClientService.current.clientMachineServices.useAllServicesQuery(
    machine.id,
    needsMergeLookup
  );

  const activeQuery = showAllServices ? allServicesQuery : curatedQuery;
  let services: ClientMachineServiceStatus[] = activeQuery.data ?? [];

  if (needsMergeLookup && mergeLookupQuery.data) {
    const existingNames = new Set(services.map((service) => service.serviceName));
    const userAddedMatches = mergeLookupQuery.data.filter(
      (service) => userAddedServiceNames.includes(service.serviceName) && !existingNames.has(service.serviceName)
    );
    services = [...services, ...userAddedMatches];
  }

  const visibleServices = searchQuery.trim()
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
        <ButtonSharedComponent
          variant={showAllServices ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setShowAllServices((prev) => !prev)}
        >
          {showAllServices ? 'Show Defaults' : 'Show All Services'}
        </ButtonSharedComponent>
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
            searchQuery.trim()
              ? 'No services matched your search.'
              : showAllServices
              ? 'No services found on this machine.'
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
