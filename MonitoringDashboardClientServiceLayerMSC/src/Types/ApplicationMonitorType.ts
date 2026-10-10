export interface EndpointHitResult {
  success: boolean;
  statusCode: number | null;
  responseBody: unknown;
  durationMs: number;
  errorMessage: string | null;
}

export interface ApplicationEndpoint {
  id: string;
  label: string;
  checkType: string;
  config: unknown;
  // Null if this endpoint has never been hit.
  lastHit: (EndpointHitResult & { checkedAt: string }) | null;
}

export interface MonitoredApplication {
  id: string;
  slug: string;
  name: string;
  baseUrl: string;
  iconName: string | null;
  endpoints: ApplicationEndpoint[];
}
