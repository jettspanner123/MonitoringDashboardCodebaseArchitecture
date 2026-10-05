import DurationFormatHelper from "./DurationFormatHelper";

export default class SmokeCheckFailureClassifier {
    public static current = new SmokeCheckFailureClassifier();

    // Used by both the main per-page content check and each popup's content
    // check: a genuine Playwright timeout gets the "took more than X" message
    // (when this check has a bounded timeoutMs to report); anything else that
    // goes wrong in this phase (a non-timeout assertion failure, say) gets a
    // neutral fallback instead, since it isn't actually a timing issue.
    public classify(
        error: unknown,
        timeoutMs: number | undefined
    ): { message: string; technicalReason: string } {
        const technicalReason = error instanceof Error ? error.message : String(error);
        const isTimeout = error instanceof Error && (error.name === 'TimeoutError' || /Timeout \d+ms exceeded/.test(error.message));
        const message = isTimeout && timeoutMs
            ? `Took more than ${DurationFormatHelper.current.formatMs(timeoutMs)} to load.`
            : 'Failed to find the expected content on the page.';

        return { message, technicalReason };
    }
}
