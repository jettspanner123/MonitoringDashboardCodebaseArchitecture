import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronRight,
  Search,
  RefreshCw,
  Download,
  List,
  LayoutGrid,
  Play,
} from 'lucide-react';
import CardSharedComponent from '../../Shared/Components/CardSharedComponent';
import BadgeSharedComponent from '../../Shared/Components/BadgeSharedComponent';
import ButtonSharedComponent from '../../Shared/Components/ButtonSharedComponent';
import PrimaryActionButtonSharedComponent from '../../Shared/Components/PrimaryActionButtonSharedComponent';
import EmptyStateSharedComponent from '../../Shared/Components/EmptyStateSharedComponent';
import CustomSelectSharedComponent, { type SelectOption } from '../../Shared/Components/CustomSelectSharedComponent';
import ConfirmationModalSharedComponent from '../../Shared/Components/ConfirmationModalSharedComponent';
import DateFormatterUtility from '../../Utilities/DateFormatterUtility';
import RunsService from '../../Services/RunsService';
import type { RunSummary, HealthType } from '../../Types';
import DashboardCON from './Constants/DashboardCON';

export interface DashboardScreenControllerProps {
  runs: RunSummary[];
  isLoading: boolean;
  isRefetching: boolean;
  onRefetch: () => void;
  onSelectRun: (run: RunSummary) => void;
}

type StatusFilterType = 'ALL' | HealthType;
type ViewModeType = 'table' | 'grid';
type GridColumnsType = 2 | 3;

function healthBadgeVariant(health: HealthType): 'success' | 'warning' | 'danger' {
  if (health === 'Healthy') return 'success';
  if (health === 'Degraded') return 'warning';
  return 'danger';
}

export default function DashboardScreenController({
  runs,
  isLoading,
  isRefetching,
  onRefetch,
  onSelectRun,
}: DashboardScreenControllerProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeStatusFilter, setActiveStatusFilter] = useState<StatusFilterType>('ALL');
  const [viewMode, setViewMode] = useState<ViewModeType>('table');
  const [gridColumns, setGridColumns] = useState<GridColumnsType>(2);
  const [isExportingCsv, setIsExportingCsv] = useState<boolean>(false);
  const [isRunTestModalOpen, setIsRunTestModalOpen] = useState<boolean>(false);

  const totalRuns = runs.length;
  const healthyCount = runs.filter((run) => run.health === 'Healthy').length;
  const degradedCount = runs.filter((run) => run.health === 'Degraded').length;
  const failedCount = runs.filter((run) => run.health === 'Failed').length;
  const flaggedCount = degradedCount + failedCount;
  const healthyPct = totalRuns > 0 ? Math.round((healthyCount / totalRuns) * 100) : 0;
  const degradedPct = totalRuns > 0 ? Math.round((degradedCount / totalRuns) * 100) : 0;
  const failedPct = totalRuns > 0 ? Math.round((failedCount / totalRuns) * 100) : 0;
  const latestRun = runs[0];

  const statusOptions: SelectOption[] = [
    { value: 'ALL', label: `All Runs (${totalRuns})` },
    { value: 'Healthy', label: `Healthy (${healthyCount})` },
    { value: 'Degraded', label: `Degraded (${degradedCount})` },
    { value: 'Failed', label: `Failed (${failedCount})` },
  ];

  const filteredRuns = useMemo(() => {
    return runs.filter((run) => {
      if (activeStatusFilter !== 'ALL' && run.health !== activeStatusFilter) return false;
      if (searchQuery.trim()) {
        const term = searchQuery.trim().toLowerCase();
        const dateStr = DateFormatterUtility.current.formatDateTime(run.createdAt).toLowerCase();
        const healthStr = run.health.toLowerCase();
        if (!dateStr.includes(term) && !healthStr.includes(term)) return false;
      }
      return true;
    });
  }, [runs, activeStatusFilter, searchQuery]);

  const handleExportCsv = async (): Promise<void> => {
    setIsExportingCsv(true);
    try {
      const details = await Promise.all(filteredRuns.map((run) => RunsService.current.getRunById(run.id)));
      const headers = ['Run Date', 'Run Health', 'Page Name', 'Check Type', 'Status', 'Message'];
      const rows: string[][] = [];
      details.forEach((detail) => {
        const dateStr = DateFormatterUtility.current.formatDateTime(detail.createdAt);
        if (detail.pageChecks.length === 0) {
          rows.push([dateStr, detail.health, '', '', '', '']);
        } else {
          detail.pageChecks.forEach((check) => {
            rows.push([dateStr, detail.health, check.pageName, check.checkType, check.status, check.message]);
          });
        }
      });
      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
      const link = document.createElement('a');
      link.href = encodedUri;
      link.download = `observacore_runs_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExportingCsv(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif-headline tracking-tight text-slate-900 dark:text-zinc-100 leading-tight">
            {DashboardCON.TITLE}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1.5 max-w-2xl">{DashboardCON.SUBTITLE}</p>
        </div>
        <div className="w-full sm:w-auto sm:shrink-0">
          <PrimaryActionButtonSharedComponent
            onClick={() => setIsRunTestModalOpen(true)}
            icon={<Play className="w-4 h-4 sm:w-3.5 sm:h-3.5 !text-white" />}
            className="w-full sm:w-auto justify-center !h-11 sm:!h-9 px-4 sm:px-3.5 text-sm sm:text-xs font-bold"
          >
            <span className="sm:hidden">Run Test</span>
            <span className="hidden sm:inline">Run Smoke Test</span>
          </PrimaryActionButtonSharedComponent>
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

      {/* Controls Toolbar */}
      <CardSharedComponent className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0 sm:max-w-md">
              <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by date or health status..."
                className="w-full h-11 sm:h-9 pl-11 pr-4 text-base sm:text-xs rounded-xl sm:rounded-lg bg-slate-50 dark:bg-[#08080a] text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 border border-slate-300 dark:border-zinc-800 focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-colors"
              />
            </div>
            <ButtonSharedComponent
              variant="outline"
              size="sm"
              disabled={isRefetching}
              isLoading={isRefetching}
              onClick={onRefetch}
              icon={<RefreshCw className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-500 dark:text-zinc-400" />}
              className="shrink-0 !px-3 sm:!px-2.5 !h-11 sm:!h-9"
            >
              <span className="sr-only">Refetch</span>
            </ButtonSharedComponent>
          </div>
          <ButtonSharedComponent
            variant="outline"
            size="sm"
            onClick={() => void handleExportCsv()}
            disabled={isExportingCsv || filteredRuns.length === 0}
            isLoading={isExportingCsv}
            icon={<Download className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-500 dark:text-zinc-400" />}
            className="w-full sm:w-auto !h-11 sm:!h-9 px-4 text-sm sm:text-xs font-bold"
          >
            Export CSV
          </ButtonSharedComponent>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-zinc-400 font-mono shrink-0">Status:</span>
            <CustomSelectSharedComponent
              value={activeStatusFilter}
              options={statusOptions}
              onChange={(val) => setActiveStatusFilter(val as StatusFilterType)}
              size="sm"
              className="w-full sm:w-60"
            />
          </div>

          <div className="hidden sm:flex items-center gap-3">
            {viewMode === 'grid' && (
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700/60 h-9 w-auto">
                <button
                  type="button"
                  onClick={() => setGridColumns(2)}
                  title="Show 2 Items Per Row"
                  className="relative flex items-center justify-center px-3.5 py-1.5 h-7 rounded-md text-xs font-bold transition-colors cursor-pointer select-none"
                >
                  {gridColumns === 2 && (
                    <motion.div
                      layoutId="activeGridDensityPill"
                      className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-md shadow-xs"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span
                    className={`relative z-10 ${
                      gridColumns === 2
                        ? 'text-slate-900 dark:text-white font-bold'
                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    2 Per Row
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setGridColumns(3)}
                  title="Show 3 Items Per Row"
                  className="relative flex items-center justify-center px-3.5 py-1.5 h-7 rounded-md text-xs font-bold transition-colors cursor-pointer select-none"
                >
                  {gridColumns === 3 && (
                    <motion.div
                      layoutId="activeGridDensityPill"
                      className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-md shadow-xs"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span
                    className={`relative z-10 ${
                      gridColumns === 3
                        ? 'text-slate-900 dark:text-white font-bold'
                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    3 Per Row
                  </span>
                </button>
              </div>
            )}

            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700/60 h-9 w-auto">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Table View"
                className="relative flex items-center justify-center gap-1.5 px-3.5 py-1.5 h-7 rounded-md text-xs font-bold transition-colors cursor-pointer select-none"
              >
                {viewMode === 'table' && (
                  <motion.div
                    layoutId="activeViewModePill"
                    className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-md shadow-xs"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span
                  className={`relative z-10 flex items-center gap-1.5 ${
                    viewMode === 'table'
                      ? 'text-slate-900 dark:text-white font-bold'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Table</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Grid View"
                className="relative flex items-center justify-center gap-1.5 px-3.5 py-1.5 h-7 rounded-md text-xs font-bold transition-colors cursor-pointer select-none"
              >
                {viewMode === 'grid' && (
                  <motion.div
                    layoutId="activeViewModePill"
                    className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-md shadow-xs"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span
                  className={`relative z-10 flex items-center gap-1.5 ${
                    viewMode === 'grid'
                      ? 'text-slate-900 dark:text-white font-bold'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </CardSharedComponent>

      <CardSharedComponent>
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

          {runs.length === 0 ? (
            <EmptyStateSharedComponent
              icon={<Activity className="w-5 h-5" />}
              title="No Runs Recorded"
              description="Once the morning smoke test automation runs, its results will appear here."
              className="w-full py-8"
            />
          ) : filteredRuns.length === 0 ? (
            <EmptyStateSharedComponent
              icon={<Search className="w-5 h-5" />}
              title="No Matching Runs"
              description="No runs match the current search or status filter."
              className="w-full py-8"
            />
          ) : viewMode === 'grid' ? (
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColumns === 3 ? 'lg:grid-cols-3' : ''} gap-3`}>
              {filteredRuns.map((run) => (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => onSelectRun(run)}
                  className="text-left rounded-xl border border-slate-200 dark:border-zinc-800 p-4 hover:bg-slate-50 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">
                      {DateFormatterUtility.current.formatDateTime(run.createdAt)}
                    </span>
                    <BadgeSharedComponent variant={healthBadgeVariant(run.health)} size="sm">
                      {run.health}
                    </BadgeSharedComponent>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">{run.pageCheckCount} page check(s)</p>
                </button>
              ))}
            </div>
          ) : (
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
                  {filteredRuns.map((run) => (
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
          )}
      </CardSharedComponent>

      <ConfirmationModalSharedComponent
        isOpen={isRunTestModalOpen}
        onClose={() => setIsRunTestModalOpen(false)}
        onConfirm={() => setIsRunTestModalOpen(false)}
        title="Run Smoke Test"
        subtitle="Automated Morning Check"
        description="Smoke tests run automatically every morning via the scheduled MorningSmokeTestAutomation script. Manually triggering a run from this dashboard isn't available yet."
        confirmText="Start Test"
        cancelText="Cancel"
        variant="primary"
        maxWidth="md"
      />
    </div>
  );
}
