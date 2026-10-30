import type { ClientMachineTokenPair } from '../Types';

class ClientMachineTokenStorageCON {
  public static readonly ACCESS_TOKEN_KEY = 'client_machine_access_token';
  public static readonly REFRESH_TOKEN_KEY = 'client_machine_refresh_token';
}

// Stores the pair in localStorage (not an httpOnly cookie) deliberately -
// the frontend (Vercel) and backend (Render) are different origins, and
// cross-site cookies would need extra SameSite/CORS plumbing for no real
// benefit here, since this JWT only gates one feature page, not the whole
// app. Access tokens are sent as an Authorization header, never a cookie.
export default class ClientMachineTokenStorageUtility {
  public static current = new ClientMachineTokenStorageUtility();

  public getTokens(): ClientMachineTokenPair | null {
    try {
      const accessToken = localStorage.getItem(ClientMachineTokenStorageCON.ACCESS_TOKEN_KEY);
      const refreshToken = localStorage.getItem(ClientMachineTokenStorageCON.REFRESH_TOKEN_KEY);
      if (!accessToken || !refreshToken) return null;
      return { accessToken, refreshToken };
    } catch {
      return null;
    }
  }

  public setTokens(tokens: ClientMachineTokenPair): void {
    try {
      localStorage.setItem(ClientMachineTokenStorageCON.ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(ClientMachineTokenStorageCON.REFRESH_TOKEN_KEY, tokens.refreshToken);
    } catch {
      // Ignore storage access errors (private browsing, quota, etc.).
    }
  }

  public clearTokens(): void {
    try {
      localStorage.removeItem(ClientMachineTokenStorageCON.ACCESS_TOKEN_KEY);
      localStorage.removeItem(ClientMachineTokenStorageCON.REFRESH_TOKEN_KEY);
    } catch {
      // Ignore.
    }
  }
}
