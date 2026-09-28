import React from 'react';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import CardSharedComponent from '../../Shared/Components/CardSharedComponent';
import BadgeSharedComponent from '../../Shared/Components/BadgeSharedComponent';
import ButtonSharedComponent from '../../Shared/Components/ButtonSharedComponent';
import EmptyStateSharedComponent from '../../Shared/Components/EmptyStateSharedComponent';
import DateFormatterUtility from '../../Utilities/DateFormatterUtility';
import type { RunDetail, StatusType } from '../../Types';
import RunDetailCON from './Constants/RunDetailCON';
import RunDetailPageCheckDetailsStaticComponent from './Components/static/RunDetailPageCheckDetailsStaticComponent';

export interface RunDetailScreenControllerProps {
  run: RunDetail | undefined;
  isLoading: boolean;
  onBack: () => void;
}

function statusBadgeVariant(status: StatusType): 'success' | 'warning' | 'danger' {
  if (status === 'Pass') return 'success';
  if (status === 'Warning') return 'warning';
  return 'danger';
}

function healthBadgeVariant(health: RunDetail['health']): 'success' | 'warning' | 'danger' {
  if (health === 'Healthy') return 'success';
  if (health === 'Degraded') return 'warning';
  return 'danger';
}

export default function RunDetailScreenController({
  run,
  isLoading,
  onBack,
}: RunDetailScreenControllerProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-zinc-800/80 pb-6">
        <div>
          <ButtonSharedComponent variant="ghost" size="sm" onClick={onBack} icon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to Runs
          </ButtonSharedComponent>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-headline tracking-tight text-slate-900 dark:text-zinc-100 leading-tight mt-3">
            {run ? DateFormatterUtility.current.formatDateTime(run.createdAt) : 'Loading run…'}
          </h1>
        </div>
        {run && (
          <BadgeSharedComponent variant={healthBadgeVariant(run.health)} size="md">
            {run.health}
          </BadgeSharedComponent>
        )}
      </div>

      <CardSharedComponent>
        <div className="mb-4">
          <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white font-serif-headline">
            Page Checks
          </h3>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((key) => (
              <div key={key} className="h-10 bg-slate-100 dark:bg-zinc-800 rounded animate-pulse" />
            ))}
          </div>
        ) : run && run.pageChecks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-300 dark:border-zinc-800 text-slate-500 dark:text-zinc-500 font-mono">
                  <th className="py-2.5 px-3">Page</th>
                  <th className="py-2.5 px-3">Check</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Message</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {run.pageChecks.map((pageCheck) => (
                  <tr key={pageCheck.id} className="hover:bg-slate-100/50 dark:hover:bg-zinc-800/40 transition-colors align-top">
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">{pageCheck.pageName}</td>
                    <td className="py-3 px-3 text-slate-500 dark:text-zinc-400">
                      {RunDetailCON.CHECK_TYPE_LABELS[pageCheck.checkType] ?? pageCheck.checkType}
                    </td>
                    <td className="py-3 px-3">
                      <BadgeSharedComponent variant={statusBadgeVariant(pageCheck.status)} size="sm">
                        {pageCheck.status}
                      </BadgeSharedComponent>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-zinc-300 max-w-xs">{pageCheck.message}</td>
                    <td className="py-3 px-3">
                      <RunDetailPageCheckDetailsStaticComponent details={pageCheck.details} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyStateSharedComponent
            icon={<ClipboardList className="w-5 h-5" />}
            title="No Page Checks Recorded"
            description="This run has no page check results yet."
            className="w-full py-8"
          />
        )}
      </CardSharedComponent>
    </div>
  );
}
