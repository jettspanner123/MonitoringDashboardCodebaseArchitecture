
export default interface IndexingFreshnessCheckTypeInterface {
    testRunId: string;
    resultCount: number;
    indexTime: Date;
    machineTime: Date;
    timeDifference: number;
    isFresh: boolean;
    message: string;
}
