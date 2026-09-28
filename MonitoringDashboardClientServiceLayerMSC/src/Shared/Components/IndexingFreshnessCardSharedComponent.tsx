import React from 'react';
import { Database, Clock } from 'lucide-react';
import CardSharedComponent from './CardSharedComponent';
import BadgeSharedComponent from './BadgeSharedComponent';
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

  const tone = isFresh
    ? { gradient: 'from-emerald-600/10 via-slate-600/5', iconBg: 'bg-emerald-800', heroText: 'text-emerald-600 dark:text-emerald-400' }
    : { gradient: 'from-amber-500/10 via-slate-500/5', iconBg: 'bg-amber-700', heroText: 'text-amber-600 dark:text-amber-400' };

  return (
    <CardSharedComponent className={`space-y-4 bg-gradient-to-br ${tone.gradient} to-transparent dark:bg-[#0d0d10]`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-lg ${tone.iconBg} text-white dark:bg-zinc-800/90 dark:text-zinc-200 flex items-center justify-center shadow-xs shrink-0`}
          >
            <Database className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono block truncate">
              Indexing Freshness
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate block">
              {check.pageName || 'Indexing Freshness'}
            </span>
          </div>
        </div>
        <BadgeSharedComponent variant={isFresh ? 'success' : 'warning'} size="sm">
          {isFresh ? 'Fresh' : 'Stale'}
        </BadgeSharedComponent>
      </div>

      {/* Tier 1: hero stat - the primary freshness signal, color-coded and dominant */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className={`text-4xl font-extrabold font-mono tracking-tight leading-none ${tone.heroText}`}>
            {timeDifferenceMinutes !== null ? `${timeDifferenceMinutes.toFixed(1)}m` : '—'}
          </div>
          <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 dark:text-zinc-500 mt-1.5">
            Index Delay
          </div>
        </div>
        {/* Tier 2: secondary stat - clearly smaller/quieter than the hero */}
        {resultCount !== null && (
          <div className="text-right">
            <div className="text-base font-bold font-mono text-slate-600 dark:text-zinc-300">
              {resultCount.toLocaleString()}
            </div>
            <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 dark:text-zinc-500 mt-0.5">
              Results
            </div>
          </div>
        )}
      </div>

      {/* Tier 3: tertiary detail - muted, small, timestamp-only */}
      {(indexTime || machineTime) && (
        <div className="pt-3 border-t border-slate-200/60 dark:border-zinc-800/80 space-y-1.5 text-[11px] font-mono text-slate-500 dark:text-zinc-400">
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

      <p className="text-xs text-slate-500 dark:text-zinc-400">{check.message || 'No additional details.'}</p>
    </CardSharedComponent>
  );
}
