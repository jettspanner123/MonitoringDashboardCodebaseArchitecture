import ApplicationDatabaseProvider from '../../../Providers/ApplicationDatabaseProvider';

export interface HealthCheckReport {
    status: 'Healthy' | 'Unhealthy';
    databaseReachable: boolean;
}

export default class HealthCheckService {
    public static current = new HealthCheckService();

    public async checkHealth(): Promise<HealthCheckReport> {
        try {
            await ApplicationDatabaseProvider.current.client.$queryRaw`SELECT 1`;
            return { status: 'Healthy', databaseReachable: true };
        } catch {
            return { status: 'Unhealthy', databaseReachable: false };
        }
    }
}
