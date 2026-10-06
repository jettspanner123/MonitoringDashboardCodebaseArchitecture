export default class ApplicationNetworkAPIConfiguration {
  public static readonly BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
  // Same host as BASE_URL, just the ws(s) scheme a WebSocket connection needs
  // instead of http(s) - derived rather than configured separately, so the
  // two can never drift apart.
  public static readonly WS_BASE_URL: string = ApplicationNetworkAPIConfiguration.BASE_URL.replace(/^http/, 'ws');
}
