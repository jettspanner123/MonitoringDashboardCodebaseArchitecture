import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, FileBarChart, Download } from 'lucide-react';
import CardSharedComponent from '../../Shared/Components/CardSharedComponent';
import BadgeSharedComponent from '../../Shared/Components/BadgeSharedComponent';
import ButtonSharedComponent from '../../Shared/Components/ButtonSharedComponent';
import EmptyStateSharedComponent from '../../Shared/Components/EmptyStateSharedComponent';
import PingCheckCardSharedComponent from '../../Shared/Components/PingCheckCardSharedComponent';
import LoginCheckCardSharedComponent from '../../Shared/Components/LoginCheckCardSharedComponent';
import PageLoadCheckCardSharedComponent from '../../Shared/Components/PageLoadCheckCardSharedComponent';
import IndexingFreshnessCardSharedComponent from '../../Shared/Components/IndexingFreshnessCardSharedComponent';
import QueueStatusCardSharedComponent from '../../Shared/Components/QueueStatusCardSharedComponent';
import DateFormatterUtility from '../../Utilities/DateFormatterUtility';
import ReportService from '../../Services/ReportService';
import ReportPDFExportService from '../../Services/ReportPDFExportService';
import DashboardCON from '../Dashboard/Constants/DashboardCON';
import type { GeneratedReportType, PageCheckType, ReportCategoryKeyType } from '../../Types';

export interface ReportScreenControllerProps {
  reportId: string;
  onBack: () => void;
}

const REPORT_CONTENT_ELEMENT_ID = 'generated-report-content';

class ReportScreenCON {
  public static readonly CATEGORY_ORDER: ReportCategoryKeyType[] = [
    'AuthenticationLogin',
    'AuthenticationPing',
    'PageLoad',
    'AtlasWidget',
    'IndexingFreshness',
    'QueueStatus',
  ];

  public static readonly CATEGORY_LABELS: Record<ReportCategoryKeyType, string> = {
    AuthenticationLogin: 'Authentication Login',
    AuthenticationPing: 'Authentication Ping',
    PageLoad: 'Page Loads',
    AtlasWidget: 'Atlas Widgets',
    IndexingFreshness: 'Indexing Freshness',
    QueueStatus: 'Queue Status',
  };

  public static readonly CARD_COMPONENT: Record<ReportCategoryKeyType, React.ComponentType<{ check: PageCheckType }>> = {
    AuthenticationLogin: LoginCheckCardSharedComponent,
    AuthenticationPing: PingCheckCardSharedComponent,
    PageLoad: PageLoadCheckCardSharedComponent,
    AtlasWidget: PageLoadCheckCardSharedComponent,
    IndexingFreshness: IndexingFreshnessCardSharedComponent,
    QueueStatus: QueueStatusCardSharedComponent,
  };

  public static readonly DAY_DOT_CLASS: Record<string, string> = {
    complete: 'bg-emerald-500',
    partial: 'bg-amber-500',
    empty: 'bg-slate-200 dark:bg-zinc-800',
  };

  public static categoryLabel(selectionKey: string): string {
    const [category, subItem] = selectionKey.split(':');
    const label = ReportScreenCON.CATEGORY_LABELS[category as ReportCategoryKeyType] ?? category;
    return subItem ? `${label} — ${subItem}` : label;
  }

  public static formatDateKey(dateKey: string): string {
    return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, { dateStyle: 'medium' });
  }
}

export default function ReportScreenController({ reportId, onBack }: ReportScreenControllerProps): React.JSX.Element {
  const [report, setReport] = useState<GeneratedReportType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    ReportService.current
      .getReportById(reportId)
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Failed to load the report.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reportId]);

  const handleExportPdf = async (): Promise<void> => {
    setIsExportingPdf(true);
    try {
      await ReportPDFExportService.current.exportElementToPDF(REPORT_CONTENT_ELEMENT_ID, `Report_${reportId}.pdf`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export the PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const environmentLabel = report
    ? (DashboardCON.ENVIRONMENTS.find((env) => env.value === report.environment)?.label ?? report.environment)
    : '';
  const rangeLabel = report
    ? report.rangeStart === report.rangeEnd || report.content.mode === 'single-day'
      ? ReportScreenCON.formatDateKey(report.content.mode === 'single-day' ? report.content.date : report.rangeStart)
      : `${DateFormatterUtility.current.formatDateTime(report.rangeStart).split(',')[0]} – ${DateFormatterUtility.current.formatDateTime(report.rangeEnd).split(',')[0]}`
    : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-zinc-800/80 pb-6">
        <div>
          <ButtonSharedComponent variant="ghost" size="sm" onClick={onBack} icon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to Dashboard
          </ButtonSharedComponent>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-headline tracking-tight text-slate-900 dark:text-zinc-100 leading-tight mt-3">
            {report ? `Report — ${rangeLabel}` : 'Loading report…'}
          </h1>
          {report && <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 font-mono">{environmentLabel}</p>}
        </div>
        {report && (
          <ButtonSharedComponent
            variant="outline"
            size="sm"
            onClick={() => void handleExportPdf()}
            disabled={isExportingPdf}
            isLoading={isExportingPdf}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export PDF
          </ButtonSharedComponent>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((key) => (
            <div key={key} className="h-32 rounded-xl bg-slate-100 dark:bg-zinc-800/60 animate-pulse" />
          ))}
        </div>
      ) : loadError || !report ? (
        <CardSharedComponent>
          <EmptyStateSharedComponent
            icon={<FileBarChart className="w-5 h-5" />}
            title="Report Not Found"
            description={loadError ?? 'This report could not be loaded.'}
            className="w-full py-8"
          />
        </CardSharedComponent>
      ) : (
        <div id={REPORT_CONTENT_ELEMENT_ID} className="space-y-6">
          {report.content.mode === 'single-day' ? (
            ReportScreenCON.CATEGORY_ORDER.map((categoryKey) => {
              const group = report.content.mode === 'single-day' ? report.content.categories[categoryKey] : undefined;
              if (!group || group.checks.length === 0) return null;
              const CardComponent = ReportScreenCON.CARD_COMPONENT[categoryKey];
              return (
                <div key={categoryKey} className="space-y-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono">
                    {ReportScreenCON.CATEGORY_LABELS[categoryKey]}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.checks.map((check) => (
                      <CardComponent key={`${check.pageName}::${check.checkType}`} check={check} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {Object.entries(report.content.categories).map(([key, summary]) => (
                  <div
                    key={key}
                    className="rounded-2xl p-3.5 sm:p-5 bg-white dark:bg-[#171717] border border-slate-300/70 dark:border-zinc-800/80 shadow-xs"
                  >
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 font-mono truncate block">
                      {ReportScreenCON.categoryLabel(key)}
                    </span>
                    <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between gap-2">
                      <div className="text-xl sm:text-2xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-zinc-50">
                        {summary.passRate}%
                      </div>
                      <BadgeSharedComponent variant={summary.failed === 0 ? 'success' : 'danger'} size="sm">
                        {summary.passed}/{summary.total} passed
                      </BadgeSharedComponent>
                    </div>
                  </div>
                ))}
              </div>

              <CardSharedComponent className="p-4 space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono">
                  Day-by-Day Completeness
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(report.content.dayCompleteness)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([dateKey, state]) => (
                      <div
                        key={dateKey}
                        title={`${ReportScreenCON.formatDateKey(dateKey)} — ${state}`}
                        className={`w-6 h-6 rounded-md ${ReportScreenCON.DAY_DOT_CLASS[state]}`}
                      />
                    ))}
                </div>
              </CardSharedComponent>

              <CardSharedComponent>
                <div className="mb-4">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white font-serif-headline">
                    Failures
                  </h2>
                </div>
                {report.content.failures.length === 0 ? (
                  <EmptyStateSharedComponent
                    icon={<FileBarChart className="w-5 h-5" />}
                    title="No Failures"
                    description="Every selected check passed across the full date range."
                    className="w-full py-8"
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-300 dark:border-zinc-800 text-slate-500 dark:text-zinc-500 font-mono">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Page</th>
                          <th className="py-2.5 px-3">Message</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                        {report.content.failures.map((failure, index) => (
                          <tr key={index} className="hover:bg-slate-100/50 dark:hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3 px-3 font-mono text-slate-500 dark:text-zinc-400">
                              {ReportScreenCON.formatDateKey(failure.date)}
                            </td>
                            <td className="py-3 px-3 text-slate-600 dark:text-zinc-300">
                              {ReportScreenCON.CATEGORY_LABELS[failure.category]}
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">{failure.pageName}</td>
                            <td className="py-3 px-3 text-slate-600 dark:text-zinc-300 max-w-md truncate">
                              {failure.message}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardSharedComponent>
            </>
          )}
        </div>
      )}
    </div>
  );
}
