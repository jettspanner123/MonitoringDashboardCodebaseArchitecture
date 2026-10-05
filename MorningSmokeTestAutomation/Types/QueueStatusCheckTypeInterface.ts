
export default interface QueueStatusCheckTypeInterface {
    testRunId: string;
    pageName: string;
    state: string;
    lessThan10Min: string;
    lessThan1Hour: string;
    lessThan4Hours: string;
    greaterThan4Hours: string;
}
