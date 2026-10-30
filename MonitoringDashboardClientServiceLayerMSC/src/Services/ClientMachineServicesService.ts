import ApplicationNetworkAPIConfiguration from '../Configurations/ApplicationNetworkAPIConfiguration';
import ClientMachineTokenStorageUtility from '../Utilities/ClientMachineTokenStorageUtility';
import type { ApiResponseType, ClientMachine, ClientMachineServiceActionType, ClientMachineServiceStatus } from '../Types';

class ClientMachineServicesServiceCON {
  public static readonly BASE_URL = `${ApplicationNetworkAPIConfiguration.BASE_URL}/api/v1/client-machine-services`;
}

export default class ClientMachineServicesService {
  public static current = new ClientMachineServicesService();

  private authHeaders(): HeadersInit {
    const tokens = ClientMachineTokenStorageUtility.current.getTokens();
    return tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
  }

  public async getMachines(): Promise<ClientMachine[]> {
    const response = await fetch(`${ClientMachineServicesServiceCON.BASE_URL}/machines`, {
      headers: this.authHeaders(),
    });
    const body: ApiResponseType<ClientMachine[]> = await response.json();
    if (!body.success || !body.data) {
      throw new Error(body.message || 'Failed to load client machines.');
    }
    return body.data;
  }

  public async getCuratedServices(machineId: string): Promise<ClientMachineServiceStatus[]> {
    const response = await fetch(`${ClientMachineServicesServiceCON.BASE_URL}/machines/${machineId}/services`, {
      headers: this.authHeaders(),
    });
    const body: ApiResponseType<ClientMachineServiceStatus[]> = await response.json();
    if (!body.success || !body.data) {
      throw new Error(body.message || 'Failed to load the curated service list.');
    }
    return body.data;
  }

  public async getAllServices(machineId: string): Promise<ClientMachineServiceStatus[]> {
    const response = await fetch(`${ClientMachineServicesServiceCON.BASE_URL}/machines/${machineId}/services/all`, {
      headers: this.authHeaders(),
    });
    const body: ApiResponseType<ClientMachineServiceStatus[]> = await response.json();
    if (!body.success || !body.data) {
      throw new Error(body.message || 'Failed to load all services on this machine.');
    }
    return body.data;
  }

  public async startAction(
    machineId: string,
    serviceName: string,
    action: ClientMachineServiceActionType
  ): Promise<string> {
    const response = await fetch(
      `${ClientMachineServicesServiceCON.BASE_URL}/machines/${machineId}/services/${encodeURIComponent(serviceName)}/actions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
        body: JSON.stringify({ action }),
      }
    );
    const body: ApiResponseType<{ actionAttemptId: string }> = await response.json();
    if (!body.success || !body.data) {
      throw new Error(body.message || 'Failed to start the action.');
    }
    return body.data.actionAttemptId;
  }
}
