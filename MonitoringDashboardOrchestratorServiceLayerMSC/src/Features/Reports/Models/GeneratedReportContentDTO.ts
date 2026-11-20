import type PageCheckDTO from '../../Runs/Models/PageCheckDTO';
import type DayCompletenessStateType from './DayCompletenessStateType';
import type ReportCategoryKeyType from './ReportCategoryKeyType';

// A single day's exact results, grouped by category - the same PageCheckDTO
// shape the Dashboard's own "Today's Test" tab already renders, just
// filtered to the selected categories/sub-items.
export interface SingleDayReportContentDTO {
    mode: 'single-day';
    date: string;
    categories: Partial<Record<ReportCategoryKeyType, { checks: PageCheckDTO[] }>>;
}

export interface ReportCategorySummaryDTO {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
}

export interface ReportFailureEntryDTO {
    date: string;
    category: ReportCategoryKeyType;
    pageName: string;
    message: string;
}

// A multi-day range's aggregated view. `categories` is keyed by either a
// bare ReportCategoryKeyType (no sub-items) or "<ReportCategoryKeyType>:<pageName>"
// (Page Loads/Atlas Widgets/Queue Status sub-items) - the same selection-key
// scheme the request body and the stored GeneratedReport.selectedKeys use
// (see specs/001-generate-report/data-model.md).
export interface RangeReportContentDTO {
    mode: 'range';
    categories: Record<string, ReportCategorySummaryDTO>;
    dayCompleteness: Record<string, DayCompletenessStateType>;
    failures: ReportFailureEntryDTO[];
}

type GeneratedReportContentDTO = SingleDayReportContentDTO | RangeReportContentDTO;

export default GeneratedReportContentDTO;
