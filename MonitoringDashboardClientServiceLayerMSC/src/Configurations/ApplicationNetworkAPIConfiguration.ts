export default class ApplicationNetworkAPIConfiguration {
  public static readonly BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
}
