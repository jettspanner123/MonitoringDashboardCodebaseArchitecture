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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CardSharedComponent>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Total Runs</span>
            <span className="p-1.5 rounded-md bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <div className="h-7 w-16 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
            ) : (
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                {totalRuns}
              </span>
            )}
          </div>
        </CardSharedComponent>

        <CardSharedComponent>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Healthy</span>
            <span className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <div className="h-7 w-16 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
            ) : (
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                {healthyCount}
              </span>
            )}
          </div>
        </CardSharedComponent>

        <CardSharedComponent>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Degraded</span>
            <span className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <div className="h-7 w-16 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
            ) : (
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                {degradedCount}
              </span>
            )}
          </div>
        </CardSharedComponent>

        <CardSharedComponent>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Failed</span>
            <span className="p-1.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <XCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <div className="h-7 w-16 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
            ) : (
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                {failedCount}
              </span>
            )}
          </div>
        </CardSharedComponent>
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
