import type { PageCheckType } from './PageCheckType';

// Mirrors the backend's ReportCategoryKeyType exactly - the six buckets a
// report's content is organized by (Page Loads and Atlas Widgets are split
// out even though they share one raw PageCheckType.checkType value).
export type ReportCategoryKeyType =
  | 'AuthenticationLogin'
  | 'AuthenticationPing'
  | 'PageLoad'
  | 'AtlasWidget'
  | 'IndexingFreshness'
  | 'QueueStatus';

// Per-day state for the modal's date picker and a range report's own
// day-by-day strip (same rule, reused in both places).
export type DayCompletenessStateType = 'complete' | 'partial' | 'empty';

export interface AvailableCategoriesType {
  pageLoad: string[];
  atlasWidget: string[];
  queueStatus: string[];
}

export interface SingleDayReportContentType {
  mode: 'single-day';
  date: string;
  categories: Partial<Record<ReportCategoryKeyType, { checks: PageCheckType[] }>>;
}

export interface ReportCategorySummaryType {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
}

export interface ReportFailureEntryType {
  date: string;
  category: ReportCategoryKeyType;
  pageName: string;
  message: string;
}

export interface RangeReportContentType {
  mode: 'range';
  categories: Record<string, ReportCategorySummaryType>;
  dayCompleteness: Record<string, DayCompletenessStateType>;
  failures: ReportFailureEntryType[];
}

export type GeneratedReportContentType = SingleDayReportContentType | RangeReportContentType;

export interface GeneratedReportType {
  id: string;
  environment: string;
  rangeStart: string;
  rangeEnd: string;
  selectedKeys: string[];
  content: GeneratedReportContentType;
  createdAt: string;
}
