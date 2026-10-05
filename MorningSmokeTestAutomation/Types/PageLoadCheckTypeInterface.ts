
export default interface PageLoadCheckTypeInterface {
    testRunId: string;
    pageName: string;
    success: boolean;
    message: string;
    // The raw underlying error text, when one exists (a thrown goto()
    // exception, or a selector-wait timeout) - null for a clean HTTP-status
    // failure or a success, since message already says everything there.
    technicalReason: string | null;
    statusCode: number | null;
    // Wall-clock time (ms) the open took: page.goto() for a main page, or
    // click-to-loaded for a popup check reusing this same table/type.
    durationMs: number | null;
}
