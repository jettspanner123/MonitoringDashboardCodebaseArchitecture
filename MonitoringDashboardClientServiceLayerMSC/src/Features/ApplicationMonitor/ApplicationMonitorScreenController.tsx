import React from 'react';
import { ServerOff, Clock } from 'lucide-react';
import ApplicationEndpointCardSharedComponent from '../../Shared/Components/ApplicationEndpointCardSharedComponent';
import EmptyStateSharedComponent from '../../Shared/Components/EmptyStateSharedComponent';
import DateFormatterUtility from '../../Utilities/DateFormatterUtility';
import type { ApplicationEndpoint, MonitoredApplication } from '../../Types';

export interface ApplicationMonitorScreenControllerProps {
  applications: MonitoredApplication[];
  isLoading: boolean;
  activeAppSlug: string;
}

class ApplicationMonitorCON {
  // "HttpEndpoint" is the only checkType today; a future "DatabaseConnection"
  // etc. just needs its own entry here - the grouping below already handles
  // any number of groups, it just has one today.
  public static readonly CHECK_TYPE_HEADINGS: Record<string, string> = {
    HttpEndpoint: 'HTTP Endpoints',
  };
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

export default function ApplicationMonitorScreenController({
  applications,
  isLoading,
  activeAppSlug,
}: ApplicationMonitorScreenControllerProps): React.JSX.Element {
  const application = applications.find((candidate) => candidate.slug === activeAppSlug);
  const mostRecentHitTimestamp = application ? getMostRecentHitTimestamp(application.endpoints) : null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((placeholderKey) => (
          <div key={placeholderKey} className="h-40 rounded-xl bg-slate-100 dark:bg-zinc-800/60 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!application) {
    return (
      <EmptyStateSharedComponent
        icon={<ServerOff className="w-6 h-6" />}
        title="Application Not Configured"
        description={`No monitored application is registered for "${activeAppSlug}" yet.`}
        className="w-full py-8"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif-headline tracking-tight text-slate-900 dark:text-zinc-100 leading-tight">
            {application.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1.5 max-w-2xl flex items-center flex-wrap gap-2">
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
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono">
              {ApplicationMonitorCON.CHECK_TYPE_HEADINGS[checkType] ?? checkType}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {endpoints.map((endpoint) => (
                <ApplicationEndpointCardSharedComponent key={endpoint.id} endpoint={endpoint} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
