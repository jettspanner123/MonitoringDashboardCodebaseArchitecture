import React, { useMemo } from 'react';
import type { RunSummary, HealthType } from '../../Types';

export interface HealthByDayBarChartSharedComponentProps {
  runs: RunSummary[];
}

interface DayBucket {
  date: Date;
  label: string;
  run: RunSummary | null;
}

const HEALTH_BAR_HEIGHT_PERCENT: Record<HealthType, number> = {
  Healthy: 100,
  Degraded: 60,
  Failed: 35,
};

const HEALTH_BAR_CLASSNAME: Record<HealthType, string> = {
  Healthy: 'bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-sm shadow-emerald-500/20',
  Degraded: 'bg-gradient-to-b from-blue-500 to-[#1332BD] shadow-sm shadow-blue-500/20',
  Failed: 'bg-gradient-to-b from-rose-500 to-rose-700 shadow-sm shadow-rose-500/20',
};

const NO_DATA_BAR_HEIGHT_PERCENT = 18;

function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function normalizeHealth(health: HealthType | null | undefined): HealthType | null {
  if (health === 'Healthy' || health === 'Degraded' || health === 'Failed') return health;
  return null;
}

export default function HealthByDayBarChartSharedComponent({
  runs,
}: HealthByDayBarChartSharedComponentProps): React.JSX.Element {
  const safeRuns = Array.isArray(runs) ? runs : [];

  const days = useMemo<DayBucket[]>(() => {
    const today = new Date();
    const buckets: DayBucket[] = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);
      const label = date.toLocaleDateString(undefined, { weekday: 'short' });
      const run =
        safeRuns.find((candidate) => {
          const createdAt = new Date(candidate.createdAt);
          return !Number.isNaN(createdAt.getTime()) && isSameCalendarDay(createdAt, date);
        }) ?? null;
      buckets.push({ date, label, run });
    }
    return buckets;
  }, [safeRuns]);

  const mostRecentDayWithDataIndex = useMemo(() => {
    for (let i = days.length - 1; i >= 0; i -= 1) {
      if (days[i].run) return i;
    }
    return -1;
  }, [days]);

  return (
    <div className="rounded-2xl p-6 bg-white dark:bg-[#0d0d10] border border-slate-200/90 dark:border-zinc-800/80 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white font-serif-headline">
          Health by Day
        </h3>
      </div>

      <div className="py-6 flex flex-col justify-end">
        <div className="h-44 w-full flex items-end justify-between gap-2 sm:gap-3 px-1 sm:px-2">
          {days.map((day, index) => {
            const health = normalizeHealth(day.run?.health);
            const isHighlighted = index === mostRecentDayWithDataIndex;
            const heightPercent = health ? HEALTH_BAR_HEIGHT_PERCENT[health] : NO_DATA_BAR_HEIGHT_PERCENT;
            const barClassName = health
              ? HEALTH_BAR_CLASSNAME[health]
              : 'bg-slate-100 dark:bg-zinc-900 border-2 border-dashed border-slate-200 dark:border-zinc-800';

            return (
              <div
                key={day.date.toISOString()}
                className="flex-1 flex flex-col items-center justify-end h-full relative group min-w-0"
              >
                {isHighlighted && (
                  <div className="mb-2 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap">
                    {health ?? 'No data'}
                  </div>
                )}
                <div
                  title={
                    day.run
                      ? `${day.label}: ${day.run.health} (${day.run.pageCheckCount} checks)`
                      : `${day.label}: no run recorded`
                  }
                  className={`w-full max-w-[34px] rounded-2xl transition-transform duration-200 hover:-translate-y-0.5 ${barClassName}`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between items-center text-[10px] sm:text-xs font-medium text-slate-400 dark:text-zinc-500 mt-4 px-1 sm:px-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
          {days.map((day, index) => (
            <span
              key={day.date.toISOString()}
              className={`flex-1 text-center truncate ${
                index === mostRecentDayWithDataIndex ? 'font-bold text-slate-700 dark:text-zinc-200' : ''
              }`}
            >
              {day.label}
            </span>
          ))}
        </div>
      </div>

      <footer className="pt-2 border-t border-slate-100/70 dark:border-zinc-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Healthy
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#1332BD]" />
            Degraded
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-700" />
            Failed
          </span>
        </div>
        <span className="font-medium text-slate-700 dark:text-zinc-300">
          {days.filter((day) => day.run).length}/7 days recorded
        </span>
      </footer>
    </div>
  );
}
