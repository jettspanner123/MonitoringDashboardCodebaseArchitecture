import React from 'react';
import RunDetailScreenController from '../Features/RunDetail/RunDetailScreenController';
import type { RunDetail } from '../Types';

export interface RunDetailScreenRouteProps {
  run: RunDetail | undefined;
  isLoading: boolean;
  onBack: () => void;
}

export default function RunDetailScreenRoute({
  run,
  isLoading,
  onBack,
}: RunDetailScreenRouteProps): React.JSX.Element {
  return <RunDetailScreenController run={run} isLoading={isLoading} onBack={onBack} />;
}
