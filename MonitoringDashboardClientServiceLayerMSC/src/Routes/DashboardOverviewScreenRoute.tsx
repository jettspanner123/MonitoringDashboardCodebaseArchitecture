import React from 'react';
import DashboardScreenController from '../Features/Dashboard/DashboardScreenController';
import type { RunSummary } from '../Types';

export interface DashboardOverviewScreenRouteProps {
  runs: RunSummary[];
  isLoading: boolean;
  isRefetching: boolean;
  onRefetch: () => void;
  onSelectRun: (run: RunSummary) => void;
}

export default function DashboardOverviewScreenRoute({
  runs,
  isLoading,
  isRefetching,
  onRefetch,
  onSelectRun,
}: DashboardOverviewScreenRouteProps): React.JSX.Element {
  return (
    <DashboardScreenController
      runs={runs}
      isLoading={isLoading}
      isRefetching={isRefetching}
      onRefetch={onRefetch}
      onSelectRun={onSelectRun}
    />
  );
}
