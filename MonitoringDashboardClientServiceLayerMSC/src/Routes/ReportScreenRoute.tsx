import React from 'react';
import ReportScreenController from '../Features/Report/ReportScreenController';

export interface ReportScreenRouteProps {
  reportId: string;
  onBack: () => void;
}

export default function ReportScreenRoute({ reportId, onBack }: ReportScreenRouteProps): React.JSX.Element {
  return <ReportScreenController reportId={reportId} onBack={onBack} />;
}
