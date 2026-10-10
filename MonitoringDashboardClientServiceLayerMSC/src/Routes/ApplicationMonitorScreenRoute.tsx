import React from 'react';
import ApplicationMonitorScreenController from '../Features/ApplicationMonitor/ApplicationMonitorScreenController';
import type { MonitoredApplication } from '../Types';

export interface ApplicationMonitorScreenRouteProps {
  applications: MonitoredApplication[];
  isLoading: boolean;
  activeAppSlug: string;
}

export default function ApplicationMonitorScreenRoute({
  applications,
  isLoading,
  activeAppSlug,
}: ApplicationMonitorScreenRouteProps): React.JSX.Element {
  return (
    <ApplicationMonitorScreenController applications={applications} isLoading={isLoading} activeAppSlug={activeAppSlug} />
  );
}
