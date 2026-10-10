import { useMutation, useQuery } from '@tanstack/react-query';
import TanstackQueryKeysCON from '../Constants/TanstackQueryKeysCON';
import RunsService from './RunsService';
import ApplicationMonitorService from './ApplicationMonitorService';

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
    useHitEndpointMutation: () => {
      return useMutation({
        mutationFn: (endpointId: string) => ApplicationMonitorService.current.hitEndpoint(endpointId),
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
