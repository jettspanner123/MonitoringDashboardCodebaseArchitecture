import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
  CalendarDays,
  CalendarRange,
} from 'lucide-react';
import CardSharedComponent from '../../Shared/Components/CardSharedComponent';
import BadgeSharedComponent from '../../Shared/Components/BadgeSharedComponent';
import ButtonSharedComponent from '../../Shared/Components/ButtonSharedComponent';
import PrimaryActionButtonSharedComponent from '../../Shared/Components/PrimaryActionButtonSharedComponent';
import EmptyStateSharedComponent from '../../Shared/Components/EmptyStateSharedComponent';
import CustomSelectSharedComponent, { type SelectOption } from '../../Shared/Components/CustomSelectSharedComponent';
import DatePickerSharedComponent from '../../Shared/Components/DatePickerSharedComponent';
import ConfirmationModalSharedComponent from '../../Shared/Components/ConfirmationModalSharedComponent';
import HealthByDayBarChartSharedComponent from '../../Shared/Components/HealthByDayBarChartSharedComponent';
import SegmentedControlSharedComponent from '../../Shared/Components/SegmentedControlSharedComponent';
import PingCheckCardSharedComponent from '../../Shared/Components/PingCheckCardSharedComponent';
import LoginCheckCardSharedComponent from '../../Shared/Components/LoginCheckCardSharedComponent';
import PageLoadCheckCardSharedComponent from '../../Shared/Components/PageLoadCheckCardSharedComponent';
import IndexingFreshnessCardSharedComponent from '../../Shared/Components/IndexingFreshnessCardSharedComponent';
import QueueStatusCardSharedComponent from '../../Shared/Components/QueueStatusCardSharedComponent';
import DateFormatterUtility from '../../Utilities/DateFormatterUtility';
import RunsService from '../../Services/RunsService';
import type { RunSummary, RunDetail, HealthType } from '../../Types';
import DashboardCON from './Constants/DashboardCON';

// Local-calendar date key ('YYYY-MM-DD') - matches how DatePickerSharedComponent
// keys dates, so a run's createdAt and the picker's selection compare directly.
function toDateKey(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
type GridColumnsLabelType = '2 Per Row' | '3 Per Row';
type ScopeFilterType = 'Today' | 'Week';

function healthBadgeVariant(health: HealthType): 'success' | 'warning' | 'danger' {
  if (health === 'Healthy') return 'success';
  if (health === 'Degraded') return 'warning';
  return 'danger';
}

function checkStatusBadgeVariant(status: string): 'success' | 'warning' | 'danger' {
  if (status === 'Pass') return 'success';
  if (status === 'Warning') return 'warning';
  return 'danger';
}

// "AuthenticationPing" -> "Authentication Ping"
function formatCheckTypeLabel(checkType: string): string {
  return checkType.replace(/([A-Z])/g, ' $1').trim();
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
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>(
    DashboardCON.RUN_SMOKE_TEST_ENVIRONMENTS[0].value,
  );
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(
    () => new Set(DashboardCON.RUN_SMOKE_TEST_ITEMS.map((item) => item.id)),
  );

  const toggleTestSelection = (id: string): void => {
    setSelectedTestIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAuthenticationLoginUnchecked = !selectedTestIds.has(DashboardCON.AUTHENTICATION_LOGIN_TEST_ID);
  const [scopeFilter, setScopeFilter] = useState<ScopeFilterType>('Today');
  // todayRunDetail/isLoadingTodayRun hold whichever run is currently
  // selected below (defaults to today's most recent run, but the date
  // picker + run dropdown can point this at any past date that has data).
  const [todayRunDetail, setTodayRunDetail] = useState<RunDetail | null>(null);
  const [isLoadingTodayRun, setIsLoadingTodayRun] = useState<boolean>(false);
  const [todaySearchQuery, setTodaySearchQuery] = useState<string>('');
  // Decorative for now - there's no environment concept anywhere in the
  // database yet, so selecting a different one doesn't change what's shown.
  const [todayEnvironment, setTodayEnvironment] = useState<string>(
    DashboardCON.RUN_SMOKE_TEST_ENVIRONMENTS[0].value,
  );
  const [todayViewMode, setTodayViewMode] = useState<ViewModeType>('grid');
  const [todayGridColumns, setTodayGridColumns] = useState<GridColumnsType>(3);

  const todayDateKey = useMemo(() => toDateKey(new Date().toISOString()), []);
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayDateKey);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  // Every run, grouped by the local calendar day it happened on - drives
  // both which dates the picker allows and which runs the dropdown lists.
  const runsByDateKey = useMemo(() => {
    const map = new Map<string, RunSummary[]>();
    for (const run of runs) {
      const key = toDateKey(run.createdAt);
      const existing = map.get(key);
      if (existing) {
        existing.push(run);
      } else {
        map.set(key, [run]);
      }
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return map;
  }, [runs]);

  const runsForSelectedDate = useMemo(
    () => runsByDateKey.get(selectedDateKey) ?? [],
    [runsByDateKey, selectedDateKey],
  );

  const isDateUnavailable = (dateKey: string): boolean => !runsByDateKey.has(dateKey);

  // If the selected date has no run matching the currently selected run id
  // (new date picked, or first mount), default to that date's most recent run.
  useEffect(() => {
    if (runsForSelectedDate.length === 0) {
      setSelectedRunId(null);
      return;
    }
    if (!runsForSelectedDate.some((run) => run.id === selectedRunId)) {
      setSelectedRunId(runsForSelectedDate[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runsForSelectedDate]);

  useEffect(() => {
    if (!selectedRunId) {
      setTodayRunDetail(null);
      return;
    }
    let cancelled = false;
    setIsLoadingTodayRun(true);
    RunsService.current
      .getRunById(selectedRunId)
      .then((detail) => {
        if (!cancelled) setTodayRunDetail(detail);
      })
      .catch(() => {
        if (!cancelled) setTodayRunDetail(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingTodayRun(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedRunId]);

  const todaySearchFilteredChecks = useMemo(() => {
    const checks = todayRunDetail?.pageChecks ?? [];
    const term = todaySearchQuery.trim().toLowerCase();
    if (!term) return checks;
    return checks.filter((check) => {
      return (
        check.pageName.toLowerCase().includes(term) ||
        check.checkType.toLowerCase().includes(term) ||
        check.status.toLowerCase().includes(term) ||
        check.message.toLowerCase().includes(term)
      );
    });
  }, [todayRunDetail, todaySearchQuery]);

  const todayAuthChecks = useMemo(
    () =>
      todaySearchFilteredChecks.filter(
        (check) => check.checkType === 'AuthenticationPing' || check.checkType === 'AuthenticationLogin',
      ),
    [todaySearchFilteredChecks],
  );
  const todayPageLoadChecks = useMemo(
    () =>
      todaySearchFilteredChecks.filter(
        (check) => check.checkType === 'PageLoad' && !check.pageName.startsWith('AtlasWidget'),
      ),
    [todaySearchFilteredChecks],
  );
  const todayAtlasWidgetChecks = useMemo(
    () =>
      todaySearchFilteredChecks.filter(
        (check) => check.checkType === 'PageLoad' && check.pageName.startsWith('AtlasWidget'),
      ),
    [todaySearchFilteredChecks],
  );
  const todayIndexingChecks = useMemo(
    () => todaySearchFilteredChecks.filter((check) => check.checkType === 'IndexingFreshness'),
    [todaySearchFilteredChecks],
  );
  const todayQueueChecks = useMemo(
    () => todaySearchFilteredChecks.filter((check) => check.checkType === 'QueueStatus'),
    [todaySearchFilteredChecks],
  );
  const isTodayRefetching = isRefetching || isLoadingTodayRun;
  const todayGridColsClass = todayGridColumns === 3 ? 'lg:grid-cols-3' : '';

  const totalRuns = runs.length;
  const healthyCount = runs.filter((run) => run.health === 'Healthy').length;
  const degradedCount = runs.filter((run) => run.health === 'Degraded').length;
  const failedCount = runs.filter((run) => run.health === 'Failed').length;
  const flaggedCount = degradedCount + failedCount;
  const healthyPct = totalRuns > 0 ? Math.round((healthyCount / totalRuns) * 100) : 0;
  const degradedPct = totalRuns > 0 ? Math.round((degradedCount / totalRuns) * 100) : 0;
  const failedPct = totalRuns > 0 ? Math.round((failedCount / totalRuns) * 100) : 0;

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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto sm:shrink-0">
          {/* Scope Segmented Control (Today vs Week) */}
          <SegmentedControlSharedComponent<ScopeFilterType>
            value={scopeFilter}
            onChange={setScopeFilter}
            layoutId="activeScopeFilterPill"
            fullWidthOnMobile
            hapticFeedback
            activeTextClassName="text-[#0C2086] dark:text-zinc-100 font-semibold"
            inactiveTextClassName="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            options={[
              { value: 'Today', label: "Today's Test", icon: <CalendarDays className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> },
              { value: 'Week', label: 'Weekly Data', icon: <CalendarRange className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> },
            ]}
          />

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

      <AnimatePresence mode="wait">
      {scopeFilter === 'Today' && (
        <motion.div
          key="today-test-content"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Controls Toolbar */}
          <CardSharedComponent className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="relative flex-1 min-w-0 sm:max-w-md">
                  <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  <input
                    type="text"
                    value={todaySearchQuery}
                    onChange={(e) => setTodaySearchQuery(e.target.value)}
                    placeholder="Search by page, check type, status, or message..."
                    className="w-full h-11 sm:h-9 pl-11 pr-4 text-base sm:text-xs rounded-xl sm:rounded-lg bg-slate-50 dark:bg-[#08080a] text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 border border-slate-300 dark:border-zinc-800 focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-colors"
                  />
                </div>
                <ButtonSharedComponent
                  variant="outline"
                  size="sm"
                  disabled={isTodayRefetching}
                  isLoading={isTodayRefetching}
                  onClick={onRefetch}
                  icon={<RefreshCw className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-500 dark:text-zinc-400" />}
                  className="shrink-0 !px-3 sm:!px-2.5 !h-11 sm:!h-9"
                >
                  <span className="sr-only">Refetch</span>
                </ButtonSharedComponent>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-zinc-400 font-mono shrink-0">Environment:</span>
                <CustomSelectSharedComponent
                  value={todayEnvironment}
                  options={DashboardCON.RUN_SMOKE_TEST_ENVIRONMENTS}
                  onChange={setTodayEnvironment}
                  size="sm"
                  className="w-full sm:w-60"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800/80 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-zinc-400 font-mono shrink-0">Date:</span>
                  <DatePickerSharedComponent
                    value={selectedDateKey}
                    onChange={setSelectedDateKey}
                    isDateDisabled={isDateUnavailable}
                    size="sm"
                    className="w-full sm:w-44"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-zinc-400 font-mono shrink-0">Run:</span>
                  <CustomSelectSharedComponent
                    value={selectedRunId ?? ''}
                    options={runsForSelectedDate.map((run) => ({
                      value: run.id,
                      label: DateFormatterUtility.current.formatTime(run.createdAt),
                      sublabel: run.id,
                    }))}
                    onChange={setSelectedRunId}
                    placeholder="No runs"
                    size="sm"
                    className="w-full sm:w-52"
                  />
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-3">
                {todayViewMode === 'grid' && (
                  <SegmentedControlSharedComponent<GridColumnsLabelType>
                    value={todayGridColumns === 2 ? '2 Per Row' : '3 Per Row'}
                    onChange={(val) => setTodayGridColumns(val === '2 Per Row' ? 2 : 3)}
                    layoutId="todayGridDensityPill"
                    options={[
                      { value: '2 Per Row', label: '2 Per Row' },
                      { value: '3 Per Row', label: '3 Per Row' },
                    ]}
                  />
                )}

                <SegmentedControlSharedComponent<ViewModeType>
                  value={todayViewMode}
                  onChange={setTodayViewMode}
                  layoutId="todayViewModePill"
                  options={[
                    { value: 'table', label: 'Table', icon: <List className="w-3.5 h-3.5" /> },
                    { value: 'grid', label: 'Grid', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
                  ]}
                />
              </div>
            </div>
          </CardSharedComponent>

          {isLoadingTodayRun ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((placeholderKey) => (
                <div key={placeholderKey} className="h-32 rounded-xl bg-slate-100 dark:bg-zinc-800/60 animate-pulse" />
              ))}
            </div>
          ) : !todayRunDetail || todayRunDetail.pageChecks.length === 0 ? (
            <CardSharedComponent>
              <EmptyStateSharedComponent
                icon={<CalendarDays className="w-5 h-5" />}
                title={selectedDateKey === todayDateKey ? 'No Test Run Today Yet' : 'No Test Run Recorded'}
                description={
                  selectedDateKey === todayDateKey
                    ? "The morning smoke test hasn't run yet today — check back after 8:30 AM."
                    : 'This run has no page check results.'
                }
                className="w-full py-8"
              />
            </CardSharedComponent>
          ) : todaySearchFilteredChecks.length === 0 ? (
            <CardSharedComponent>
              <EmptyStateSharedComponent
                icon={<Search className="w-5 h-5" />}
                title="No Matching Checks"
                description="No checks match the current search."
                className="w-full py-8"
              />
            </CardSharedComponent>
          ) : todayViewMode === 'table' ? (
            <CardSharedComponent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-300 dark:border-zinc-800 text-slate-500 dark:text-zinc-500 font-mono">
                      <th className="py-2.5 px-3">Page</th>
                      <th className="py-2.5 px-3">Check Type</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                    {todaySearchFilteredChecks.map((check) => (
                      <tr key={check.id} className="hover:bg-slate-100/50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-medium text-slate-900 dark:text-zinc-100">
                          {check.pageName}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500 dark:text-zinc-400">
                          {formatCheckTypeLabel(check.checkType)}
                        </td>
                        <td className="py-3 px-3">
                          <BadgeSharedComponent variant={checkStatusBadgeVariant(check.status)} size="sm">
                            {check.status}
                          </BadgeSharedComponent>
                        </td>
                        <td className="py-3 px-3 text-slate-500 dark:text-zinc-400 max-w-md truncate">
                          {check.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardSharedComponent>
          ) : (
            <>
              {todayAuthChecks.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono">
                    Authentication
                  </h2>
                  <div className={`grid grid-cols-1 sm:grid-cols-2 ${todayGridColsClass} gap-4`}>
                    {todayAuthChecks.map((check) =>
                      check.checkType === 'AuthenticationPing' ? (
                        <PingCheckCardSharedComponent key={check.id} check={check} />
                      ) : (
                        <LoginCheckCardSharedComponent key={check.id} check={check} />
                      ),
                    )}
                  </div>
                </div>
              )}

              {todayPageLoadChecks.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono">
                    Page Loads
                  </h2>
                  <div className={`grid grid-cols-1 sm:grid-cols-2 ${todayGridColsClass} gap-4`}>
                    {todayPageLoadChecks.map((check) => (
                      <PageLoadCheckCardSharedComponent key={check.id} check={check} />
                    ))}
                  </div>
                </div>
              )}

              {todayAtlasWidgetChecks.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono">
                    Atlas Widgets
                  </h2>
                  <div className={`grid grid-cols-1 sm:grid-cols-2 ${todayGridColsClass} gap-4`}>
                    {todayAtlasWidgetChecks.map((check) => (
                      <PageLoadCheckCardSharedComponent key={check.id} check={check} />
                    ))}
                  </div>
                </div>
              )}

              {todayIndexingChecks.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono">
                    Indexing Freshness
                  </h2>
                  <div className={`grid grid-cols-1 sm:grid-cols-2 ${todayGridColsClass} gap-4`}>
                    {todayIndexingChecks.map((check) => (
                      <IndexingFreshnessCardSharedComponent key={check.id} check={check} />
                    ))}
                  </div>
                </div>
              )}

              {todayQueueChecks.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono">
                    Queue Status
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {todayQueueChecks.map((check) => (
                      <QueueStatusCardSharedComponent key={check.id} check={check} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}
      {scopeFilter === 'Week' && (
        <motion.div
          key="weekly-data-content"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 2: Healthy */}
        <div className="rounded-2xl p-3.5 sm:p-5 relative overflow-hidden bg-gradient-to-br from-emerald-600/10 via-slate-600/5 to-transparent dark:bg-[#0d0d10] border border-slate-300/70 dark:border-zinc-800/80 shadow-xs">
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
        <div className="rounded-2xl p-3.5 sm:p-5 relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-slate-500/5 to-transparent dark:bg-[#0d0d10] border border-slate-300/70 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 font-mono truncate">
              Degraded
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0C2086] text-white dark:bg-zinc-800/90 dark:text-zinc-200 flex items-center justify-center shadow-xs shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>

          <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between gap-1 sm:gap-2">
            {isLoading ? (
              <div className="h-6 sm:h-7 w-14 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
            ) : (
              <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-zinc-50">
                {degradedCount}
              </div>
            )}
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-indigo-900 dark:text-zinc-300 bg-indigo-100/80 dark:bg-zinc-800/80 border border-indigo-200/60 dark:border-zinc-700/60 px-1.5 sm:px-2 py-0.5 rounded-md">
              {degradedPct}% of runs
            </span>
          </div>

          <div className="mt-2.5 sm:mt-3.5 pt-2 sm:pt-2.5 border-t border-slate-200/60 dark:border-zinc-800/80 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-zinc-400">
            <span className="truncate">Needs Review</span>
            <span className="flex items-center gap-1 font-semibold text-indigo-800 dark:text-zinc-300 shrink-0">
              <AlertTriangle className="w-3 h-3 text-indigo-600 dark:text-zinc-400 hidden sm:inline" />
              Latest Flag
            </span>
          </div>
        </div>

        {/* Card 4: Failed */}
        <div className="rounded-2xl p-3.5 sm:p-5 relative overflow-hidden bg-gradient-to-br from-rose-600/10 via-slate-600/5 to-transparent dark:bg-[#0d0d10] border border-slate-300/70 dark:border-zinc-800/80 shadow-xs">
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

        {/* Card 5: Total Runs */}
        <div className="rounded-2xl p-3.5 sm:p-5 relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-slate-500/5 to-transparent dark:bg-[#0d0d10] border border-slate-300/70 dark:border-zinc-800/80 shadow-xs">
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
      </div>

      {/* Charts: 7-day health history */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 items-stretch">
        <HealthByDayBarChartSharedComponent runs={runs} />
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
              <SegmentedControlSharedComponent<GridColumnsLabelType>
                value={gridColumns === 2 ? '2 Per Row' : '3 Per Row'}
                onChange={(val) => setGridColumns(val === '2 Per Row' ? 2 : 3)}
                layoutId="activeGridDensityPill"
                options={[
                  { value: '2 Per Row', label: '2 Per Row' },
                  { value: '3 Per Row', label: '3 Per Row' },
                ]}
              />
            )}

            <SegmentedControlSharedComponent<ViewModeType>
              value={viewMode}
              onChange={setViewMode}
              layoutId="activeViewModePill"
              options={[
                { value: 'table', label: 'Table', icon: <List className="w-3.5 h-3.5" /> },
                { value: 'grid', label: 'Grid', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
              ]}
            />
          </div>
        </div>
      </CardSharedComponent>

      <CardSharedComponent>
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
        </motion.div>
      )}
      </AnimatePresence>

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
        additionalContent={
          <div className="space-y-3.5">
            <CustomSelectSharedComponent
              label="Environment"
              value={selectedEnvironment}
              onChange={setSelectedEnvironment}
              options={DashboardCON.RUN_SMOKE_TEST_ENVIRONMENTS}
              size="sm"
            />
            <div>
              <span className="text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5 block">
                Tests that will run
              </span>
              <div className="rounded-lg border border-slate-200 dark:border-zinc-800 divide-y divide-slate-100 dark:divide-zinc-800/60 overflow-hidden">
                {DashboardCON.RUN_SMOKE_TEST_ITEMS.map((item) => {
                  const isChecked = selectedTestIds.has(item.id);
                  return (
                    <label
                      key={item.id}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleTestSelection(item.id)}
                        className="w-3.5 h-3.5 rounded border-slate-300 dark:border-zinc-700 text-[#0C2086] focus:ring-[#0C2086] shrink-0"
                      />
                      <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 flex items-center justify-center shrink-0">
                        <item.icon className="w-3.5 h-3.5" />
                      </div>
                      <span
                        className={`font-medium ${
                          isChecked
                            ? 'text-slate-700 dark:text-zinc-200'
                            : 'text-slate-400 dark:text-zinc-500 line-through'
                        }`}
                      >
                        {item.label}
                      </span>
                    </label>
                  );
                })}
              </div>
              {isAuthenticationLoginUnchecked && (
                <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>No tests can proceed if the Authentication Login Test is skipped — every other check depends on being signed in first.</span>
                </div>
              )}
            </div>
          </div>
        }
      />
    </div>
  );
}
