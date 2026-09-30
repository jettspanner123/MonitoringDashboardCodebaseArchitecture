import React, { useMemo } from 'react';
import { Activity } from 'lucide-react';
import EmptyStateSharedComponent from './EmptyStateSharedComponent';
import type { RunSummary } from '../../Types';

export interface HealthRateGaugeSharedComponentProps {
  runs: RunSummary[];
  windowSize?: number;
  compact?: boolean;
}

interface GaugeTick {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeOpacity: number;
  strokeWidth: number;
}

const TOTAL_TICKS = 34;
const GAUGE_CENTER_X = 100;
const GAUGE_CENTER_Y = 96;
const GAUGE_INNER_RADIUS = 68;
const GAUGE_OUTER_RADIUS = 88;
const INACTIVE_TICK_COLOR = '#e2e8f0';
const ACTIVE_TICK_COLOR = '#10b981';

export default function HealthRateGaugeSharedComponent({
  runs,
  windowSize = 7,
  compact = false,
}: HealthRateGaugeSharedComponentProps): React.JSX.Element {
  const safeRuns = Array.isArray(runs) ? runs : [];
  const effectiveWindow = Math.max(0, Math.min(windowSize, safeRuns.length));
  const recentRuns = safeRuns.slice(0, effectiveWindow);
  const healthyCount = recentRuns.filter((run) => run.health === 'Healthy').length;
  const percentage = effectiveWindow > 0 ? Math.round((healthyCount / effectiveWindow) * 100) : 0;

  const ticks = useMemo<GaugeTick[]>(() => {
    const fraction = effectiveWindow > 0 ? healthyCount / effectiveWindow : 0;
    const activeTicksCount = Math.round(TOTAL_TICKS * fraction);
    const result: GaugeTick[] = [];
    for (let i = 0; i <= TOTAL_TICKS; i += 1) {
      const angleDeg = 180 - i * (180 / TOTAL_TICKS);
      const angleRad = (angleDeg * Math.PI) / 180;
      const x1 = GAUGE_CENTER_X + GAUGE_INNER_RADIUS * Math.cos(angleRad);
      const y1 = GAUGE_CENTER_Y - GAUGE_INNER_RADIUS * Math.sin(angleRad);
      const x2 = GAUGE_CENTER_X + GAUGE_OUTER_RADIUS * Math.cos(angleRad);
      const y2 = GAUGE_CENTER_Y - GAUGE_OUTER_RADIUS * Math.sin(angleRad);
      const isActive = activeTicksCount > 0 && i <= activeTicksCount;
      result.push({
        key: `tick-${i}`,
        x1,
        y1,
        x2,
        y2,
        stroke: isActive ? ACTIVE_TICK_COLOR : INACTIVE_TICK_COLOR,
        strokeOpacity: isActive ? 0.5 + 0.5 * (i / activeTicksCount) : 1,
        strokeWidth: isActive ? 2.8 : 2.4,
      });
    }
    return result;
  }, [effectiveWindow, healthyCount]);

  if (safeRuns.length === 0 && compact) {
    return (
      <div className="rounded-2xl p-3.5 sm:p-5 relative overflow-hidden bg-white dark:bg-[#0d0d10] border border-slate-300/70 dark:border-zinc-800/80 shadow-xs flex flex-col items-center justify-center h-full text-center">
        <Activity className="w-4 h-4 text-slate-300 dark:text-zinc-600 mb-1.5" />
        <span className="text-xs font-mono text-slate-400 dark:text-zinc-500">No data yet</span>
      </div>
    );
  }

  if (safeRuns.length === 0) {
    return (
      <div className="rounded-2xl p-6 bg-white dark:bg-[#0d0d10] border border-slate-200/90 dark:border-zinc-800/80 shadow-xs flex flex-col justify-center h-full">
        <EmptyStateSharedComponent
          icon={<Activity className="w-5 h-5" />}
          title="No Health Data Yet"
          description="Once runs are recorded, this gauge will show the recent Healthy rate."
          className="w-full py-4"
        />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="rounded-2xl p-3.5 sm:p-5 relative overflow-hidden bg-white dark:bg-[#0d0d10] border border-slate-300/70 dark:border-zinc-800/80 shadow-xs flex flex-col items-center justify-center h-full">
        <div className="relative w-full aspect-[2/1] overflow-hidden flex items-end justify-center">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 200 100">
            <g strokeLinecap="round">
              {ticks.map((tick) => (
                <line
                  key={tick.key}
                  x1={tick.x1}
                  y1={tick.y1}
                  x2={tick.x2}
                  y2={tick.y2}
                  stroke={tick.stroke}
                  strokeOpacity={tick.strokeOpacity}
                  strokeWidth={tick.strokeWidth}
                />
              ))}
            </g>
          </svg>
          <div className="absolute bottom-0 inset-x-0 flex flex-col items-center justify-end text-center pb-0.5">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight leading-none">
              {percentage}%
            </span>
          </div>
        </div>
        <p className="text-xs sm:text-sm font-mono font-medium text-slate-500 dark:text-zinc-400 mt-1.5 sm:mt-2 text-center truncate w-full">
          Last {effectiveWindow} run{effectiveWindow === 1 ? '' : 's'} Healthy
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6 bg-white dark:bg-[#0d0d10] border border-slate-200/90 dark:border-zinc-800/80 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between h-full">
      <header className="flex items-center justify-between pb-2">
        <div className="space-y-0.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Reliability Metric
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100 tracking-tight">Health Rate</h2>
        </div>
      </header>

      <div className="relative py-2 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-[280px] aspect-[2/1] overflow-hidden flex items-end justify-center">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 200 100">
            <g strokeLinecap="round">
              {ticks.map((tick) => (
                <line
                  key={tick.key}
                  x1={tick.x1}
                  y1={tick.y1}
                  x2={tick.x2}
                  y2={tick.y2}
                  stroke={tick.stroke}
                  strokeOpacity={tick.strokeOpacity}
                  strokeWidth={tick.strokeWidth}
                />
              ))}
            </g>
          </svg>
          <div className="absolute bottom-0 inset-x-0 flex flex-col items-center justify-end text-center pb-1">
            <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight leading-none">
              {percentage}%
            </span>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400 mt-2">
              Last {effectiveWindow} run{effectiveWindow === 1 ? '' : 's'} Healthy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
