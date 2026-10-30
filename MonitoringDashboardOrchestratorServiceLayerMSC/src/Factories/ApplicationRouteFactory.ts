class HealthCheckRoutes {
    public static readonly CONTROLLER_URL = '/api/v1/health-check';
    public static readonly STATUS = '/';
    public static readonly PING = '/ping';
}

class RunsRoutes {
    public static readonly CONTROLLER_URL = '/api/v1/runs';
    public static readonly GET_ALL = '/';
    public static readonly GET_BY_ID = '/:id';
    public static readonly TRIGGER = '/trigger';
    public static readonly LIVE = '/:testRunId/live';
}

class DataManagementRoutes {
    public static readonly CONTROLLER_URL = '/api/v1/data-management';
    public static readonly WIPE_ALL = '/wipe-all';
}

class ApplicationMonitorRoutes {
    public static readonly CONTROLLER_URL = '/api/v1/application-monitor';
    public static readonly GET_APPLICATIONS = '/applications';
    public static readonly HIT_ENDPOINT = '/endpoints/:id/hit';
    public static readonly HIT_LIVE = '/hit-attempts/:hitAttemptId/live';
}

class ClientMachineServicesRoutes {
    public static readonly CONTROLLER_URL = '/api/v1/client-machine-services';
    public static readonly LOGIN = '/auth/login';
    public static readonly REFRESH = '/auth/refresh';
    public static readonly RELAY_STATUS = '/relay/status';
    public static readonly RELAY_CONNECT = '/relay/connect';
    public static readonly GET_MACHINES = '/machines';
    public static readonly GET_CURATED_SERVICES = '/machines/:machineId/services';
    public static readonly GET_ALL_SERVICES = '/machines/:machineId/services/all';
    public static readonly START_ACTION = '/machines/:machineId/services/:serviceName/actions';
    public static readonly ACTION_LIVE = '/action-attempts/:actionAttemptId/live';
}

class NotificationsRoutes {
    public static readonly CONTROLLER_URL = '/api/v1/notifications';
    public static readonly GET_VAPID_PUBLIC_KEY = '/vapid-public-key';
    public static readonly SUBSCRIBE = '/subscribe';
    public static readonly UNSUBSCRIBE = '/subscribe';
    // Hit by an external cron, not from the frontend - see PushNotificationService.
    public static readonly CHECK_AND_NOTIFY = '/check-and-notify';
}

export default class ApplicationRouteFactory {
    public static current = new ApplicationRouteFactory();

    public readonly healthCheck = HealthCheckRoutes;
    public readonly runs = RunsRoutes;
    public readonly dataManagement = DataManagementRoutes;
    public readonly notifications = NotificationsRoutes;
    public readonly applicationMonitor = ApplicationMonitorRoutes;
    public readonly clientMachineServices = ClientMachineServicesRoutes;
}
