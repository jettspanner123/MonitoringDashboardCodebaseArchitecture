// Response shape for GET /api/v1/reports/available-categories - distinct
// pageName values actually recorded in the given environment/range, never a
// fixed list (see specs/001-generate-report/research.md §3). Authentication
// Login/Ping/Indexing Freshness have no sub-items, so they are not
// represented here - the frontend always offers them as a single checkbox.
export default interface AvailableCategoriesDTO {
    pageLoad: string[];
    atlasWidget: string[];
    queueStatus: string[];
}
