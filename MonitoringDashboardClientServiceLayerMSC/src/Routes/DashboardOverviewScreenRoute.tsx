import React from 'react';
import DashboardScreenController from '../Features/Dashboard/DashboardScreenController';
import type { RunSummary } from '../Types';

export interface DashboardOverviewScreenRouteProps {
  runs: RunSummary[];
  isLoading: boolean;
  onSelectRun: (run: RunSummary) => void;
}

export default function DashboardOverviewScreenRoute({
  runs,
  isLoading,
  onSelectRun,
}: DashboardOverviewScreenRouteProps): React.JSX.Element {
  return <DashboardScreenController runs={runs} isLoading={isLoading} onSelectRun={onSelectRun} />;
}
