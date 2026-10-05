
export default interface AuthenticationPingCheckTypeInterface {
    testRunId: string;
    success: boolean;
    message: string;
    statusCode: number | null;
}
