import PopupCheckTypeInterface from "./PopupCheckTypeInterface";

export default interface SmokePageTypeInterface {
    name: string;
    url: string;
    // Opt-in: records a PageLoadCheck (MD_PageLoadCheckTBL) right after this
    // page's initial goto(), using `name` as the pageName column.
    recordPageLoadCheck?: boolean;
    buttonSelector?: string;
    searchInputSelector?: string;
    searchTerm?: string;
    searchButtonSelector?: string;
    // Optional: omit entirely for a page-load-only check (e.g. FCS - "just
    // check if it opens", nothing further to assert on). When present, the
    // test waits for this element the same way it always has.
    expectedResultSelector?: string;
    minResultCount?: number;
    expectedCount?: number;
    hoverInfoSelector?: string;
    hoverTooltipSelector?: string;
    // Opt-in: records an IndexingFreshnessCheck (MD_IndexingFreshnessCheckTBL)
    // combining the result count and the tooltip's indexing time/freshness.
    // Requires hoverInfoSelector/hoverTooltipSelector and minResultCount to
    // also be set, since it reuses their computed values.
    recordIndexingFreshnessCheck?: boolean;
    // Opt-in: parses every row of the table at queueStatusTableSelector
    // (one row per state, e.g. Blocking/Finished/...) and writes them all to
    // the shared QueueStatusCheck table (MD_QueueStatusCheckTBL), using
    // `name` as the pageName column. Requires queueStatusTableSelector.
    recordQueueStatusCheck?: boolean;
    queueStatusTableSelector?: string;
    postResultsClickSelector?: string;
    popupChecks?: Array<PopupCheckTypeInterface>;
    // Optional: bounds every wait in this page's test (goto, selector waits,
    // popup checks, ...) instead of the default "wait forever" (timeout: 0).
    // Existing pages are known to sometimes load slowly and intentionally
    // have no cap; new, fast-opening pages (FCS, Admin Controlls, JRDS,
    // NOCAS) use this so a genuinely dead environment fails within a bounded
    // time instead of hanging the test forever.
    timeoutMs?: number;
}