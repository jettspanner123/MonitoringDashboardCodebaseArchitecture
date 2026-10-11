import ApplicationNetworkAPIConfiguration from '../Configurations/ApplicationNetworkAPIConfiguration';
import type { ApiResponseType, MonitoredApplication } from '../Types';

export default class ApplicationMonitorService {
  public static current = new ApplicationMonitorService();

  public async getApplications(): Promise<MonitoredApplication[]> {
    const response = await fetch(`${ApplicationNetworkAPIConfiguration.BASE_URL}/api/v1/application-monitor/applications`);
    const body: ApiResponseType<MonitoredApplication[]> = await response.json();
    if (!body.success || !body.data) {
      throw new Error(body.message || 'Failed to load applications.');
    }
    return body.data;
  }

  // Starts the retry-aware hit server-side and returns right away with an id
  // to watch - it does not wait for the final outcome. Pair with a WebSocket
  // to `${ApplicationNetworkAPIConfiguration.WS_BASE_URL}/api/v1/application-monitor/hit-attempts/${hitAttemptId}/live`
  // for live attempt progress and the eventual result.
  public async startHit(endpointId: string): Promise<string> {
    const response = await fetch(
      `${ApplicationNetworkAPIConfiguration.BASE_URL}/api/v1/application-monitor/endpoints/${endpointId}/hit`,
      { method: 'POST' }
    );
    const body: ApiResponseType<{ hitAttemptId: string }> = await response.json();
    if (!body.success || !body.data) {
      throw new Error(body.message || 'Failed to start the endpoint hit.');
    }
    return body.data.hitAttemptId;
  }
}
