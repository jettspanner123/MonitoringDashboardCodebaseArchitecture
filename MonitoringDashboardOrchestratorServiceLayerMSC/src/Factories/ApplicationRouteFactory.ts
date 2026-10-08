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
}
