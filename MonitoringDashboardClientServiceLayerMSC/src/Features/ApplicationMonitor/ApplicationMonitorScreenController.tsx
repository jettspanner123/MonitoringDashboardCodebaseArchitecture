import React, { useRef } from 'react';
import { ServerOff, Clock, Zap, Globe, Boxes, FileSignature, type LucideIcon } from 'lucide-react';
import ApplicationEndpointCardSharedComponent, {
  type ApplicationEndpointCardHandle,
} from '../../Shared/Components/ApplicationEndpointCardSharedComponent';
import ButtonSharedComponent from '../../Shared/Components/ButtonSharedComponent';
import EmptyStateSharedComponent from '../../Shared/Components/EmptyStateSharedComponent';
import DateFormatterUtility from '../../Utilities/DateFormatterUtility';
import type { ApplicationEndpoint, MonitoredApplication } from '../../Types';

export interface ApplicationMonitorScreenControllerProps {
  applications: MonitoredApplication[];
  isLoading: boolean;
}

class ApplicationMonitorCON {
  // "HttpEndpoint" is the only checkType today; a future "DatabaseConnection"
  // etc. just needs its own entry here - the grouping below already handles
  // any number of groups, it just has one today.
  public static readonly CHECK_TYPE_HEADINGS: Record<string, string> = {
    HttpEndpoint: 'HTTP Endpoints',
  };

  // Generic rollout flag kept from before the per-app-tab days - the context
  // menu itself (Hit/Copy URL/Copy Request/Copy Response) has nothing
  // app-specific in it, so every seeded app gets it.
  public static readonly CONTEXT_MENU_ENABLED_SLUGS: string[] = ['assetsphere', 'signforge'];

  public static readonly APP_ICONS: Record<string, LucideIcon> = {
    Boxes: Boxes,
    FileSignature: FileSignature,
  };

  public static getAppIcon(iconName: string | null): LucideIcon {
    return (iconName && ApplicationMonitorCON.APP_ICONS[iconName]) || Globe;
  }
}

// ISO 8601 strings sort correctly as plain strings, so no Date parsing is
// needed just to find the latest one - any hit counts, success or failure.
function getMostRecentHitTimestamp(endpoints: ApplicationEndpoint[]): string | null {
  const timestamps = endpoints
    .map((endpoint) => endpoint.lastHit?.checkedAt)
    .filter((checkedAt): checkedAt is string => Boolean(checkedAt));
  if (timestamps.length === 0) return null;
  return timestamps.reduce((latest, current) => (current > latest ? current : latest));
}

function groupEndpointsByCheckType(endpoints: ApplicationEndpoint[]): Array<[string, ApplicationEndpoint[]]> {
  const groups = new Map<string, ApplicationEndpoint[]>();
  for (const endpoint of endpoints) {
    const existing = groups.get(endpoint.checkType);
    if (existing) {
      existing.push(endpoint);
    } else {
      groups.set(endpoint.checkType, [endpoint]);
    }
  }
  return Array.from(groups.entries());
}

interface ApplicationSectionProps {
  application: MonitoredApplication;
  cardRefs: React.MutableRefObject<Map<string, ApplicationEndpointCardHandle>>;
}

function ApplicationSection({ application, cardRefs }: ApplicationSectionProps): React.JSX.Element {
  const mostRecentHitTimestamp = getMostRecentHitTimestamp(application.endpoints);
  const isContextMenuEnabled = ApplicationMonitorCON.CONTEXT_MENU_ENABLED_SLUGS.includes(application.slug);
  const AppIcon = ApplicationMonitorCON.getAppIcon(application.iconName);
  const [isPinging, setIsPinging] = React.useState<boolean>(false);

  const handlePingThisApp = async (): Promise<void> => {
    setIsPinging(true);
    for (const endpoint of application.endpoints) {
      await cardRefs.current.get(endpoint.id)?.triggerHit();
    }
    setIsPinging(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-zinc-800/80 pb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-[#0d2086] text-white flex items-center justify-center shadow-xs shrink-0">
            <AppIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-headline tracking-tight text-slate-900 dark:text-zinc-100 leading-tight">
              {application.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1 flex items-center flex-wrap gap-2">
              <span>{application.baseUrl}</span>
              {mostRecentHitTimestamp && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-100 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400 border border-slate-200/80 dark:border-zinc-700/60">
                  <Clock className="w-3 h-3" />
                  Last hit {DateFormatterUtility.current.formatRelativeTime(mostRecentHitTimestamp)}
                </span>
              )}
            </p>
          </div>
        </div>
        <ButtonSharedComponent
          variant="outline"
          size="sm"
          onClick={() => void handlePingThisApp()}
          disabled={isPinging || application.endpoints.length === 0}
          isLoading={isPinging}
          icon={<Zap className="w-3.5 h-3.5" />}
          className="shrink-0"
        >
          Ping {application.name}
        </ButtonSharedComponent>
      </div>

      {application.endpoints.length === 0 ? (
        <EmptyStateSharedComponent
          icon={<ServerOff className="w-6 h-6" />}
          title="No Endpoints Configured"
          description={`${application.name} has no monitored endpoints yet.`}
          className="w-full py-8"
        />
      ) : (
        groupEndpointsByCheckType(application.endpoints).map(([checkType, endpoints]) => (
          <div key={checkType} className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono">
              {ApplicationMonitorCON.CHECK_TYPE_HEADINGS[checkType] ?? checkType}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {endpoints.map((endpoint) => (
                <ApplicationEndpointCardSharedComponent
                  key={endpoint.id}
                  ref={(handle) => {
                    if (handle) cardRefs.current.set(endpoint.id, handle);
                    else cardRefs.current.delete(endpoint.id);
                  }}
                  endpoint={endpoint}
                  baseUrl={application.baseUrl}
                  enableContextMenu={isContextMenuEnabled}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function ApplicationMonitorScreenController({
  applications,
  isLoading,
}: ApplicationMonitorScreenControllerProps): React.JSX.Element {
  const cardRefs = useRef<Map<string, ApplicationEndpointCardHandle>>(new Map());
  const [isPingingAll, setIsPingingAll] = React.useState<boolean>(false);

  const handlePingAll = async (): Promise<void> => {
    setIsPingingAll(true);
    for (const application of applications) {
      for (const endpoint of application.endpoints) {
        await cardRefs.current.get(endpoint.id)?.triggerHit();
      }
    }
    setIsPingingAll(false);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((placeholderKey) => (
          <div key={placeholderKey} className="h-40 rounded-xl bg-slate-100 dark:bg-zinc-800/60 animate-pulse" />
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <EmptyStateSharedComponent
        icon={<ServerOff className="w-6 h-6" />}
        title="No Applications Registered"
        description="No monitored applications are registered yet."
        className="w-full py-8"
      />
    );
  }

  const totalEndpoints = applications.reduce((sum, application) => sum + application.endpoints.length, 0);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif-headline tracking-tight text-slate-900 dark:text-zinc-100 leading-tight">
            Application Monitoring
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1.5 max-w-2xl">
            Ping the health-check endpoints of every registered application from one place.
          </p>
        </div>
        <ButtonSharedComponent
          variant="primary"
          size="md"
          onClick={() => void handlePingAll()}
          disabled={isPingingAll || totalEndpoints === 0}
          isLoading={isPingingAll}
          icon={<Zap className="w-4 h-4" />}
          className="shrink-0"
        >
          Ping All
        </ButtonSharedComponent>
      </div>

      {applications.map((application) => (
        <ApplicationSection key={application.id} application={application} cardRefs={cardRefs} />
      ))}
    </div>
  );
}
