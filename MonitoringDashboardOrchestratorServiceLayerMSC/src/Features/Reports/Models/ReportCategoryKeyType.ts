// The six buckets a report's content is organized by - split finer than
// PageCheckDTO's own checkType, since Page Loads and Atlas Widgets share one
// raw checkType ('PageLoad') but are reported as two separate categories
// (pageName starting with "AtlasWidget" - see
// specs/001-generate-report/research.md §3).
type ReportCategoryKeyType =
    | 'AuthenticationLogin'
    | 'AuthenticationPing'
    | 'PageLoad'
    | 'AtlasWidget'
    | 'IndexingFreshness'
    | 'QueueStatus';

export default ReportCategoryKeyType;
