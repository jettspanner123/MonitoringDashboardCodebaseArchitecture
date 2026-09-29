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
  const gradient = isFresh
    ? 'from-emerald-600/10 dark:from-emerald-300/20 via-slate-600/5'
    : 'from-amber-500/10 via-slate-500/5';

  return (
    <CardSharedComponent className={`!p-0 overflow-hidden bg-gradient-to-br ${gradient} to-transparent dark:bg-[#0d0d10]`}>
      <div className="flex items-center gap-3 px-5 pt-5">
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${
            isFresh ? 'bg-emerald-800' : 'bg-amber-700'
          } text-white dark:bg-zinc-800/90 dark:text-zinc-200 flex items-center justify-center shadow-xs shrink-0`}
        >
          <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 font-mono truncate">
            {check.pageName || 'Indexing Freshness'}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-zinc-500 -mt-0.5 leading-tight truncate">
            Search index freshness check
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-zinc-800 mt-4">
        <div className="px-5 py-4 text-left">
          <div className="font-mono font-extrabold text-slate-900 dark:text-zinc-50 leading-none tracking-tight flex items-baseline gap-0.5">
            <span className="text-4xl">
              {timeDifferenceMinutes !== null ? timeDifferenceMinutes.toFixed(1) : '—'}
            </span>
            <span className="text-2xl text-slate-400 dark:text-zinc-600">m</span>
          </div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500 mt-2.5">
            Index Delay
          </div>
        </div>
        <div className="px-5 py-4 text-right">
          <div className="font-mono font-extrabold text-4xl text-slate-900 dark:text-zinc-50 leading-none tracking-tight">
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
