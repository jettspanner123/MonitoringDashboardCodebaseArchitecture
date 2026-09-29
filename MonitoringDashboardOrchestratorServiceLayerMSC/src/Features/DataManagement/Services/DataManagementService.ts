import ApplicationDatabaseProvider from '../../../Providers/ApplicationDatabaseProvider';

export default class DataManagementService {
    public static current = new DataManagementService();

    // Deletes every row from every table this dashboard reads from — child
    // check tables first, then TestRun, to respect the FK relations. Tables
    // and schema are untouched; only rows are removed. Runs as a single
    // transaction so a mid-wipe failure can't leave the DB half-empty.
    public async wipeAllData(): Promise<void> {
        const client = ApplicationDatabaseProvider.current.client;

        await client.$transaction([
            client.authenticationPingCheck.deleteMany(),
            client.authenticationLoginCheck.deleteMany(),
            client.pageLoadCheck.deleteMany(),
            client.indexingFreshnessCheck.deleteMany(),
            client.queueStatusCheck.deleteMany(),
            client.testRun.deleteMany(),
        ]);
    }
}
