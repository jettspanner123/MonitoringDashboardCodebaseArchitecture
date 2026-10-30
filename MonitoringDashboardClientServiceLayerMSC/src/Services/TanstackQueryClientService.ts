import { useQuery } from '@tanstack/react-query';
import TanstackQueryKeysCON from '../Constants/TanstackQueryKeysCON';
import RunsService from './RunsService';
import ApplicationMonitorService from './ApplicationMonitorService';
import ClientMachineServicesService from './ClientMachineServicesService';
import ClientMachineAuthService from './ClientMachineAuthService';

export default class TanstackQueryClientService {
  public static current = new TanstackQueryClientService();

  public readonly applicationMonitor = {
    useApplicationsQuery: () => {
      return useQuery({
        queryKey: TanstackQueryKeysCON.applications(),
        queryFn: () => ApplicationMonitorService.current.getApplications(),
        staleTime: 1000 * 60,
      });
    },
  };

  public readonly clientMachineServices = {
    // Polled (unlike the rest of this feature's "nothing auto-refreshes"
    // convention) because this also feeds the always-visible navbar
    // indicator, which needs to reflect live connectivity without the user
    // being on the Client Machines page at all.
    useRelayStatusQuery: () => {
      return useQuery({
        queryKey: TanstackQueryKeysCON.clientMachineRelayStatus(),
        queryFn: () => ClientMachineAuthService.current.getRelayStatus(),
        staleTime: 0,
        refetchInterval: 30000,
      });
    },
    useMachinesQuery: (enabled: boolean) => {
      return useQuery({
        queryKey: TanstackQueryKeysCON.clientMachines(),
        queryFn: () => ClientMachineServicesService.current.getMachines(),
        staleTime: 1000 * 60,
        enabled,
      });
    },
    useCuratedServicesQuery: (machineId: string, enabled: boolean) => {
      return useQuery({
        queryKey: TanstackQueryKeysCON.clientMachineCuratedServices(machineId),
        queryFn: () => ClientMachineServicesService.current.getCuratedServices(machineId),
        staleTime: 0,
        enabled: enabled && Boolean(machineId),
      });
    },
    useAllServicesQuery: (machineId: string, enabled: boolean) => {
      return useQuery({
        queryKey: TanstackQueryKeysCON.clientMachineAllServices(machineId),
        queryFn: () => ClientMachineServicesService.current.getAllServices(machineId),
        staleTime: 0,
        enabled: enabled && Boolean(machineId),
      });
    },
  };

  public readonly runs = {
    useRunsQuery: (environment?: string) => {
      return useQuery({
        queryKey: TanstackQueryKeysCON.runs(environment),
        queryFn: () => RunsService.current.getRuns(environment),
        staleTime: 1000 * 60,
      });
    },
    useRunDetailQuery: (runId: string) => {
      return useQuery({
        queryKey: TanstackQueryKeysCON.runDetail(runId),
        queryFn: () => RunsService.current.getRunById(runId),
        staleTime: 1000 * 60,
        enabled: Boolean(runId),
      });
    },
  };
}
