class HealthCheckRoutes {
    public static readonly CONTROLLER_URL = '/api/v1/health-check';
    public static readonly STATUS = '/';
    public static readonly PING = '/ping';
}

class RunsRoutes {
    public static readonly CONTROLLER_URL = '/api/v1/runs';
    public static readonly GET_ALL = '/';
    public static readonly GET_BY_ID = '/:id';
}

export default class ApplicationRouteFactory {
    public static current = new ApplicationRouteFactory();

    public readonly healthCheck = HealthCheckRoutes;
    public readonly runs = RunsRoutes;
}
