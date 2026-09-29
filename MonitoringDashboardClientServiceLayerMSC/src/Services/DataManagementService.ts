import ApplicationNetworkAPIConfiguration from '../Configurations/ApplicationNetworkAPIConfiguration';
import type { ApiResponseType } from '../Types';

export default class DataManagementService {
  public static current = new DataManagementService();

  public async wipeAllData(): Promise<void> {
    const response = await fetch(`${ApplicationNetworkAPIConfiguration.BASE_URL}/api/v1/data-management/wipe-all`, {
      method: 'DELETE',
    });
    const body: ApiResponseType<null> = await response.json();
    if (!body.success) {
      throw new Error(body.message || 'Failed to delete all data.');
    }
  }
}
