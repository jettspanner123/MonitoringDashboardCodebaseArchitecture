import ApplicationNetworkAPIConfiguration from '../Configurations/ApplicationNetworkAPIConfiguration';
import type { ApiResponseType, ClientMachineTokenPair } from '../Types';

class ClientMachineAuthServiceCON {
  public static readonly BASE_URL = `${ApplicationNetworkAPIConfiguration.BASE_URL}/api/v1/client-machine-services`;
}

export default class ClientMachineAuthService {
  public static current = new ClientMachineAuthService();

  public async login(username: string, password: string): Promise<ClientMachineTokenPair> {
    const response = await fetch(`${ClientMachineAuthServiceCON.BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const body: ApiResponseType<ClientMachineTokenPair> = await response.json();
    if (!body.success || !body.data) {
      throw new Error(body.message || 'Could not log in with those credentials.');
    }
    return body.data;
  }

  public async refresh(refreshToken: string): Promise<ClientMachineTokenPair> {
    const response = await fetch(`${ClientMachineAuthServiceCON.BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const body: ApiResponseType<ClientMachineTokenPair> = await response.json();
    if (!body.success || !body.data) {
      throw new Error(body.message || 'Session has expired.');
    }
    return body.data;
  }

  public async getRelayStatus(): Promise<boolean> {
    const response = await fetch(`${ClientMachineAuthServiceCON.BASE_URL}/relay/status`);
    const body: ApiResponseType<{ isConnected: boolean }> = await response.json();
    return Boolean(body.success && body.data?.isConnected);
  }
}
