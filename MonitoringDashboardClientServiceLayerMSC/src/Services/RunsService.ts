import ApplicationNetworkAPIConfiguration from '../Configurations/ApplicationNetworkAPIConfiguration';
import type { ApiResponseType, RunDetail, RunSummary } from '../Types';

export default class RunsService {
  public static current = new RunsService();

  public async getRuns(): Promise<RunSummary[]> {
    const response = await fetch(`${ApplicationNetworkAPIConfiguration.BASE_URL}/api/v1/runs/`);
    const body: ApiResponseType<RunSummary[]> = await response.json();
    if (!body.success || !body.data) {
      throw new Error(body.message || 'Failed to load runs.');
    }
    return body.data;
  }

  public async getRunById(runId: string): Promise<RunDetail> {
    const response = await fetch(`${ApplicationNetworkAPIConfiguration.BASE_URL}/api/v1/runs/${runId}`);
    const body: ApiResponseType<RunDetail> = await response.json();
    if (!body.success || !body.data) {
      throw new Error(body.message || 'Failed to load run.');
    }
    return body.data;
  }
}
