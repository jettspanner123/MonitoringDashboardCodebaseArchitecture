import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, CheckCircle2, AlertTriangle, XCircle, ChevronRight, PieChart as PieChartIcon } from 'lucide-react';
import CardSharedComponent from '../../Shared/Components/CardSharedComponent';
import BadgeSharedComponent from '../../Shared/Components/BadgeSharedComponent';
import EmptyStateSharedComponent from '../../Shared/Components/EmptyStateSharedComponent';
import DateFormatterUtility from '../../Utilities/DateFormatterUtility';
import type { RunSummary, HealthType } from '../../Types';
import DashboardCON from './Constants/DashboardCON';

export interface DashboardScreenControllerProps {
  runs: RunSummary[];
  isLoading: boolean;
  onSelectRun: (run: RunSummary) => void;
}

function healthBadgeVariant(health: HealthType): 'success' | 'warning' | 'danger' {
  if (health === 'Healthy') return 'success';
  if (health === 'Degraded') return 'warning';
  return 'danger';
}

export default function DashboardScreenController({
  runs,
  isLoading,
  onSelectRun,
}: DashboardScreenControllerProps): React.JSX.Element {
  const totalRuns = runs.length;
  const healthyCount = runs.filter((run) => run.health === 'Healthy').length;
  const degradedCount = runs.filter((run) => run.health === 'Degraded').length;
  const failedCount = runs.filter((run) => run.health === 'Failed').length;
  const flaggedCount = degradedCount + failedCount;
  const healthyPct = totalRuns > 0 ? Math.round((healthyCount / totalRuns) * 100) : 0;
  const degradedPct = totalRuns > 0 ? Math.round((degradedCount / totalRuns) * 100) : 0;
  const failedPct = totalRuns > 0 ? Math.round((failedCount / totalRuns) * 100) : 0;
  const latestRun = runs[0];

  const healthChartData = (['Healthy', 'Degraded', 'Failed'] as HealthType[])
    .map((health) => ({
      name: health,
      value: runs.filter((run) => run.health === health).length,
    }))
    .filter((entry) => entry.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif-headline tracking-tight text-slate-900 dark:text-zinc-100 leading-tight">
            {DashboardCON.TITLE}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1.5 max-w-2xl">{DashboardCON.SUBTITLE}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Runs */}
        <div className="rounded-2xl p-3.5 sm:p-5 relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-slate-500/5 to-transparent dark:bg-[#0d0d10] border border-slate-200/70 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 font-mono truncate">
              Total Runs
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0C2086] text-white dark:bg-zinc-800/90 dark:text-zinc-200 flex items-center justify-center shadow-xs shrink-0">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>

          <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between gap-1 sm:gap-2">
            {isLoading ? (
              <div className="h-7 sm:h-8 w-14 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
            ) : (
              <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-zinc-50">
                {totalRuns}
              </div>
            )}
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-indigo-900 dark:text-zinc-300 bg-indigo-100/80 dark:bg-zinc-800/80 border border-indigo-200/60 dark:border-zinc-700/60 px-1.5 sm:px-2 py-0.5 rounded-md">
              {flaggedCount > 0 ? `${flaggedCount} flagged` : 'All Clear'}
            </span>
          </div>

          <div className="mt-2.5 sm:mt-3.5 pt-2 sm:pt-2.5 border-t border-slate-200/60 dark:border-zinc-800/80 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-zinc-400">
            <span className="truncate">Overall History</span>
            <span className="flex items-center gap-1.5 font-semibold text-indigo-800 dark:text-zinc-300 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-zinc-400" />
              Live Monitor
            </span>
          </div>
        </div>

        {/* Card 2: Healthy */}
        <div className="rounded-2xl p-3.5 sm:p-5 relative overflow-hidden bg-gradient-to-br from-emerald-600/10 via-slate-600/5 to-transparent dark:bg-[#0d0d10] border border-slate-200/70 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 font-mono truncate">
              Healthy
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-800 text-white dark:bg-zinc-800/90 dark:text-zinc-200 flex items-center justify-center shadow-xs shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>

          <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between gap-1 sm:gap-2">
            {isLoading ? (
              <div className="h-6 sm:h-7 w-14 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
            ) : (
              <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-mono tracking-tight text-emerald-900 dark:text-zinc-50">
                {healthyCount}
              </div>
            )}
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-emerald-900 dark:text-zinc-300 bg-emerald-100/70 dark:bg-zinc-800/80 border border-emerald-200/60 dark:border-zinc-700/60 px-1.5 sm:px-2 py-0.5 rounded-md">
              {healthyPct}% of runs
            </span>
          </div>

          <div className="mt-2.5 sm:mt-3.5 pt-2 sm:pt-2.5 border-t border-slate-200/60 dark:border-zinc-800/80 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-zinc-400">
            <span className="truncate">Passing</span>
            <span className="flex items-center gap-1 font-semibold text-emerald-800 dark:text-zinc-300 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-zinc-400 hidden sm:inline" />
              Latest Pass
            </span>
          </div>
        </div>

        {/* Card 3: Degraded */}
        <div className="rounded-2xl p-3.5 sm:p-5 relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent dark:bg-[#0d0d10] border border-slate-200/70 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 font-mono truncate">
              Degraded
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#1332BD] text-white dark:bg-zinc-800/90 dark:text-zinc-200 flex items-center justify-center shadow-xs shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>

          <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between gap-1 sm:gap-2">
            {isLoading ? (
              <div className="h-6 sm:h-7 w-14 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
            ) : (
              <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-mono tracking-tight text-[#0C2086] dark:text-zinc-50">
                {degradedCount}
              </div>
            )}
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-blue-900 dark:text-zinc-300 bg-blue-50 dark:bg-zinc-800/80 border border-blue-200/60 dark:border-zinc-700/60 px-1.5 sm:px-2 py-0.5 rounded-md">
              {degradedPct}% of runs
            </span>
          </div>

          <div className="mt-2.5 sm:mt-3.5 pt-2 sm:pt-2.5 border-t border-slate-200/60 dark:border-zinc-800/80 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-zinc-400">
            <span className="truncate">Needs Review</span>
            <span className="flex items-center gap-1 font-semibold text-[#0C2086] dark:text-zinc-300 shrink-0">
              <AlertTriangle className="w-3 h-3 text-blue-600 dark:text-zinc-400 hidden sm:inline" />
              Latest Flag
            </span>
          </div>
        </div>

        {/* Card 4: Failed */}
        <div className="rounded-2xl p-3.5 sm:p-5 relative overflow-hidden bg-gradient-to-br from-rose-600/10 via-slate-600/5 to-transparent dark:bg-[#0d0d10] border border-slate-200/70 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 font-mono truncate">
              Failed
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-800 text-white dark:bg-zinc-800/90 dark:text-zinc-200 flex items-center justify-center shadow-xs shrink-0">
              <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>

          <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between gap-1 sm:gap-2">
            {isLoading ? (
              <div className="h-6 sm:h-7 w-14 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
            ) : (
              <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-mono tracking-tight text-rose-900 dark:text-zinc-50">
                {failedCount}
              </div>
            )}
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-rose-900 dark:text-zinc-300 bg-rose-100/70 dark:bg-zinc-800/80 border border-rose-200/60 dark:border-zinc-700/60 px-1.5 sm:px-2 py-0.5 rounded-md">
              {failedPct}% of runs
            </span>
          </div>

          <div className="mt-2.5 sm:mt-3.5 pt-2 sm:pt-2.5 border-t border-slate-200/60 dark:border-zinc-800/80 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-zinc-400">
            <span className="truncate">Critical</span>
            <span className="flex items-center gap-1 font-semibold text-rose-800 dark:text-zinc-300 shrink-0">
              <XCircle className="w-3 h-3 text-rose-600 dark:text-zinc-400 hidden sm:inline" />
              Needs Action
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CardSharedComponent className="lg:col-span-1">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-serif-headline">
              Health Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Across every recorded run</p>
          </div>
          <div className="h-56 flex items-center justify-center">
            {healthChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={healthChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {healthChartData.map((entry) => (
                      <Cell key={entry.name} fill={DashboardCON.HEALTH_CHART_COLORS[entry.name as HealthType]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface-elevated)',
                      borderColor: 'var(--color-hairline-strong)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'var(--color-ink)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyStateSharedComponent
                icon={<PieChartIcon className="w-5 h-5" />}
                title="No Runs Yet"
                description="No smoke test runs have been recorded yet."
                className="w-full h-full py-4"
              />
            )}
          </div>
        </CardSharedComponent>

        <CardSharedComponent className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white font-serif-headline">
                Runs
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {latestRun ? `Latest: ${DateFormatterUtility.current.formatDateTime(latestRun.createdAt)}` : 'No runs recorded yet'}
              </p>
            </div>
          </div>

          {runs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-300 dark:border-zinc-800 text-slate-500 dark:text-zinc-500 font-mono">
                    <th className="py-2.5 px-3">Run</th>
                    <th className="py-2.5 px-3">Health</th>
                    <th className="py-2.5 px-3">Page Checks</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                  {runs.map((run) => (
                    <tr key={run.id} className="hover:bg-slate-100/50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-slate-900 dark:text-zinc-100">
                        {DateFormatterUtility.current.formatDateTime(run.createdAt)}
                      </td>
                      <td className="py-3 px-3">
                        <BadgeSharedComponent variant={healthBadgeVariant(run.health)} size="sm">
                          {run.health}
                        </BadgeSharedComponent>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500 dark:text-zinc-400">{run.pageCheckCount}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onSelectRun(run)}
                          className="inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium"
                        >
                          View Details
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyStateSharedComponent
              icon={<Activity className="w-5 h-5" />}
              title="No Runs Recorded"
              description="Once the morning smoke test automation runs, its results will appear here."
              className="w-full py-8"
            />
          )}
        </CardSharedComponent>
      </div>
    </div>
  );
}
