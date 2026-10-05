
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
}