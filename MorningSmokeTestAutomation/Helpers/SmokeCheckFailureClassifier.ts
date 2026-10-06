import DurationFormatHelper from "./DurationFormatHelper";

export default class SmokeCheckFailureClassifier {
    public static current = new SmokeCheckFailureClassifier();

    // Thrown by popup content checks (SmokeTest.spec.ts) when a "HTTP Status
    // 404" heading is detected instead of the expected element - a dead
    // service renders this instead of ever producing real content, so it
    // would otherwise hang until the timeout with a confusing generic
    // failure. Shared here so the thrower and the classifier agree on the
    // marker without duplicating the literal string in both places.
    public static readonly NOT_FOUND_ERROR_PREFIX = 'SMOKE_404_DETECTED';

    // Used by both the main per-page content check and each popup's content
    // check: a genuine Playwright timeout gets the "took more than X" message
    // (when this check has a bounded timeoutMs to report); a detected "HTTP
    // Status 404" popup gets its own distinct message; anything else that
    // goes wrong in this phase (a non-timeout assertion failure, say) gets a
    // neutral fallback instead, since it isn't actually a timing issue.
    public classify(
        error: unknown,
        timeoutMs: number | undefined
    ): { message: string; technicalReason: string } {
        const technicalReason = error instanceof Error ? error.message : String(error);
        const isNotFoundPage = error instanceof Error
            && error.message.startsWith(SmokeCheckFailureClassifier.NOT_FOUND_ERROR_PREFIX);
        const isTimeout = error instanceof Error && (error.name === 'TimeoutError' || /Timeout \d+ms exceeded/.test(error.message));
        const message = isNotFoundPage
            ? 'Service not started (HTTP 404 - Not Found).'
            : isTimeout && timeoutMs
            ? `Took more than ${DurationFormatHelper.current.formatMs(timeoutMs)} to load.`
            : 'Failed to find the expected content on the page.';

        return { message, technicalReason };
    }
}
