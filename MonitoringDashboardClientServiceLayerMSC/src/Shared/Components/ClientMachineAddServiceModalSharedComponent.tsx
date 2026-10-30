import React, { useState } from 'react';
import ModalSharedComponent from './ModalSharedComponent';
import ButtonSharedComponent from './ButtonSharedComponent';
import CustomSelectSharedComponent from './CustomSelectSharedComponent';
import ClientMachineUserAddedServicesUtility from '../../Utilities/ClientMachineUserAddedServicesUtility';
import type { ClientMachine } from '../../Types';

export interface ClientMachineAddServiceModalSharedComponentProps {
  isOpen: boolean;
  onClose: () => void;
  machines: ClientMachine[];
  // Fires with the machineId once a service is added, so the caller can
  // refetch that machine's section - frontend-only (localStorage), nothing
  // is written to MD_ConfigurationConstantTBL.
  onAdded: (machineId: string) => void;
}

export default function ClientMachineAddServiceModalSharedComponent({
  isOpen,
  onClose,
  machines,
  onAdded,
}: ClientMachineAddServiceModalSharedComponentProps): React.JSX.Element {
  const [machineId, setMachineId] = useState<string>('');
  const [serviceName, setServiceName] = useState<string>('');

  const handleClose = (): void => {
    setMachineId('');
    setServiceName('');
    onClose();
  };

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    const trimmedServiceName = serviceName.trim();
    if (!machineId || !trimmedServiceName) return;

    ClientMachineUserAddedServicesUtility.current.add(machineId, trimmedServiceName);
    onAdded(machineId);
    handleClose();
  };

  return (
    <ModalSharedComponent
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Service"
      subtitle="Track an additional service on a machine (this browser only)"
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">Machine</label>
          <CustomSelectSharedComponent
            value={machineId}
            onChange={setMachineId}
            options={machines.map((machine) => ({ value: machine.id, label: machine.nickname }))}
            placeholder="Select a machine"
            size="sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">Service name (case-sensitive)</label>
          <input
            type="text"
            value={serviceName}
            onChange={(event) => setServiceName(event.target.value)}
            placeholder="e.g. XPDMEventOrchestrator"
            required
            className="w-full h-10 px-3 text-sm rounded-lg bg-slate-50 dark:bg-[#0a0a0c] text-slate-900 dark:text-zinc-100 border border-slate-200/80 dark:border-zinc-800 focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-colors font-mono"
          />
        </div>

        <ButtonSharedComponent type="submit" variant="primary" fullWidth disabled={!machineId || !serviceName.trim()}>
          Add Service
        </ButtonSharedComponent>
      </form>
    </ModalSharedComponent>
  );
}
