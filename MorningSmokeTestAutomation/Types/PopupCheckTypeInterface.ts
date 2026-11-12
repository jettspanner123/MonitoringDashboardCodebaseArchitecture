
export default  interface PopupCheckTypeInterface {
    // Used as the pageName on the shared PageLoadCheck row this popup check
    // records — shows up as its own "Page Load" card on the dashboard.
    name: string;
    compassSearchIconSelector?: string;
    compassSearchInputSelector?: string;
    compassSearchTerm?: string;
    menuItemSelector: string;
    expectedElementSelector?: string;
    closePopupAfterCheck?: boolean;
    // Opt-in: if the expectedElementSelector wait times out, reload the
    // popup once and retry the wait before treating it as a real failure.
    // For popups whose client-side bootstrap is known to occasionally fail
    // on first load but recover cleanly on a reload (confirmed for 3DSwym).
    retryOnceWithReload?: boolean;
}