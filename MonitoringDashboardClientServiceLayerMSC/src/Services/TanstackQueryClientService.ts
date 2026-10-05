import { useQuery } from '@tanstack/react-query';
import TanstackQueryKeysCON from '../Constants/TanstackQueryKeysCON';
import RunsService from './RunsService';

export default class TanstackQueryClientService {
  public static current = new TanstackQueryClientService();

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
