import ApplicationNetworkAPIConfiguration from '../Configurations/ApplicationNetworkAPIConfiguration';
import type { ApiResponseType, MonitoredApplication, EndpointHitResult } from '../Types';

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

  public async hitEndpoint(endpointId: string): Promise<EndpointHitResult> {
    const response = await fetch(
      `${ApplicationNetworkAPIConfiguration.BASE_URL}/api/v1/application-monitor/endpoints/${endpointId}/hit`,
      { method: 'POST' }
    );
    const body: ApiResponseType<EndpointHitResult> = await response.json();
    if (!body.success || !body.data) {
      throw new Error(body.message || 'Failed to hit the endpoint.');
    }
    return body.data;
  }
}
