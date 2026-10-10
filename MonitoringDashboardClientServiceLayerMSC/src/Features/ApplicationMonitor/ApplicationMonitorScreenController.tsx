import React from 'react';
import { Boxes, ServerOff } from 'lucide-react';
import ApplicationEndpointCardSharedComponent from '../../Shared/Components/ApplicationEndpointCardSharedComponent';
import EmptyStateSharedComponent from '../../Shared/Components/EmptyStateSharedComponent';
import type { MonitoredApplication } from '../../Types';

export interface ApplicationMonitorScreenControllerProps {
  applications: MonitoredApplication[];
  isLoading: boolean;
  activeAppSlug: string;
}

// Icon names are stored as plain strings in the database (MonitoredApplication.iconName)
// so a new application's row never needs a code change to pick a valid icon -
// just add its name here once its icon is known.
const ICONS_BY_NAME: Record<string, React.ComponentType<{ className?: string }>> = {
  Boxes,
};

export default function ApplicationMonitorScreenController({
  applications,
  isLoading,
  activeAppSlug,
}: ApplicationMonitorScreenControllerProps): React.JSX.Element {
  const application = applications.find((candidate) => candidate.slug === activeAppSlug);
  const AppIcon = (application?.iconName && ICONS_BY_NAME[application.iconName]) || Boxes;

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
      <div className="flex items-center gap-3 pb-6 border-b border-slate-200/80 dark:border-zinc-800/80">
        <div className="w-10 h-10 rounded-xl bg-[#0C2086] text-white dark:bg-zinc-800/90 dark:text-zinc-200 flex items-center justify-center shadow-xs shrink-0">
          <AppIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-serif-headline tracking-tight text-slate-900 dark:text-zinc-100 leading-tight">
            {application.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-mono">{application.baseUrl}</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {application.endpoints.map((endpoint) => (
            <ApplicationEndpointCardSharedComponent key={endpoint.id} endpoint={endpoint} />
          ))}
        </div>
      )}
    </div>
  );
}
