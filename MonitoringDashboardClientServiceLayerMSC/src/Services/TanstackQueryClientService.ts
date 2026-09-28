import { useQuery } from '@tanstack/react-query';
import TanstackQueryKeysCON from '../Constants/TanstackQueryKeysCON';
import RunsService from './RunsService';

export default class TanstackQueryClientService {
  public static current = new TanstackQueryClientService();

  public readonly runs = {
    useRunsQuery: () => {
      return useQuery({
        queryKey: TanstackQueryKeysCON.RUNS,
        queryFn: () => RunsService.current.getRuns(),
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
