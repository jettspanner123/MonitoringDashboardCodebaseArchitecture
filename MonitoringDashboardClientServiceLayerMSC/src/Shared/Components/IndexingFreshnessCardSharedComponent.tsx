import React from 'react';
import { Database, Clock } from 'lucide-react';
import CardSharedComponent from './CardSharedComponent';
import DateFormatterUtility from '../../Utilities/DateFormatterUtility';
import type { PageCheckType } from '../../Types';

export interface IndexingFreshnessCardSharedComponentProps {
  check: PageCheckType;
}

export default function IndexingFreshnessCardSharedComponent({
  check,
}: IndexingFreshnessCardSharedComponentProps): React.JSX.Element {
  const details = check.details ?? {};
  const resultCount = typeof details.resultCount === 'number' ? details.resultCount : null;
  const timeDifferenceMinutes = typeof details.timeDifferenceMinutes === 'number' ? details.timeDifferenceMinutes : null;
  const indexTime = typeof details.indexTime === 'string' ? details.indexTime : null;
  const machineTime = typeof details.machineTime === 'string' ? details.machineTime : null;
  const isFresh = check.status === 'Pass';

  return (
    <CardSharedComponent className="!p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2 min-w-0">
          <Database className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
          <span className="text-xs font-mono uppercase tracking-[0.15em] text-slate-400 dark:text-zinc-500 truncate">
            {check.pageName || 'Indexing Freshness'}
          </span>
        </div>
        <span
          className={`flex items-center gap-1.5 text-xs font-medium shrink-0 ${
            isFresh ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isFresh ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {isFresh ? 'Fresh' : 'Stale'}
        </span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-zinc-800 mt-4">
        <div className="px-5 py-4">
          <div className="font-serif-headline text-slate-900 dark:text-zinc-50 leading-none flex items-baseline gap-0.5">
            <span className="text-5xl tracking-tight">
              {timeDifferenceMinutes !== null ? timeDifferenceMinutes.toFixed(1) : '—'}
            </span>
            <span className="text-2xl text-slate-400 dark:text-zinc-600">m</span>
          </div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500 mt-2.5">
            Index Delay
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="font-serif-headline text-5xl text-slate-900 dark:text-zinc-50 leading-none tracking-tight">
            {resultCount !== null ? resultCount.toLocaleString() : '—'}
          </div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500 mt-2.5">
            Results
          </div>
        </div>
      </div>

      {(indexTime || machineTime) && (
        <div className="px-5 pt-3 space-y-1.5 text-[11px] font-mono text-slate-500 dark:text-zinc-400">
          {indexTime && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-slate-400 dark:text-zinc-500 shrink-0" />
              <span className="text-slate-400 dark:text-zinc-500">Index Time</span>
              <span className="text-slate-700 dark:text-zinc-200 ml-auto">
                {DateFormatterUtility.current.formatDateTime(indexTime)}
              </span>
            </div>
          )}
          {machineTime && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-slate-400 dark:text-zinc-500 shrink-0" />
              <span className="text-slate-400 dark:text-zinc-500">Machine Time</span>
              <span className="text-slate-700 dark:text-zinc-200 ml-auto">
                {DateFormatterUtility.current.formatDateTime(machineTime)}
              </span>
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-slate-400 dark:text-zinc-500 px-5 py-3.5 mt-3 border-t border-slate-100 dark:border-zinc-800/60 bg-slate-50/60 dark:bg-zinc-900/30">
        {check.message || 'No additional details.'}
      </p>
    </CardSharedComponent>
  );
}
