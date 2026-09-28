export default class DashboardCON {
  public static readonly TITLE: string = 'Monitoring Dashboard';
  public static readonly SUBTITLE: string = 'Daily 3DEXPERIENCE / 3DSpace PLM smoke test results';

  public static readonly HEALTH_CHART_COLORS: Record<'Healthy' | 'Degraded' | 'Failed', string> = {
    Healthy: '#10b981',
    Degraded: '#f59e0b',
    Failed: '#f43f5e',
  };
}
