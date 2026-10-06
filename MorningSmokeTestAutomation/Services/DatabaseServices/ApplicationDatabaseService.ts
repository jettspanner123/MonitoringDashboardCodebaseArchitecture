import ApplicationDatabaseProvider from "../../Providers/ApplicationDatabaseProvider";
import EncryptionHelper from "../../Helpers/EncryptionHelper";
import AuthenticationPingCheckTypeInterface from "../../Types/AuthenticationPingCheckTypeInterface";
import AuthenticationLoginCheckTypeInterface from "../../Types/AuthenticationLoginCheckTypeInterface";
import PageLoadCheckTypeInterface from "../../Types/PageLoadCheckTypeInterface";
import IndexingFreshnessCheckTypeInterface from "../../Types/IndexingFreshnessCheckTypeInterface";
import QueueStatusCheckTypeInterface from "../../Types/QueueStatusCheckTypeInterface";
import SmokeEnvironmentNameType from "../../Types/SmokeEnvironmentNameType";
import { Environment } from "@prisma/client";

export default class ApplicationDatabaseService {
    public static current = new ApplicationDatabaseService();

    // One row per `npx playwright test` invocation — every check for this
    // run links back to the returned id. SmokeEnvironmentNameType's values
    // (e.g. "Production") map onto the Prisma Environment enum (e.g.
    // "PRODUCTION") by a plain uppercase - see Environment in schema.prisma.
    public async startTestRun(environment: SmokeEnvironmentNameType): Promise<string> {
        const run = await ApplicationDatabaseProvider.current.client.testRun.create({
            data: { environment: environment.toUpperCase() as Environment },
        });
        return run.id;
    }

    public async recordAuthenticationPingCheck(params: AuthenticationPingCheckTypeInterface): Promise<void> {
        const {testRunId, success, message, statusCode} = params;

        await ApplicationDatabaseProvider.current.client.authenticationPingCheck.create({
            data: {testRunId, success, message, statusCode},
        });
    }

    public async recordAuthenticationLoginCheck(params: AuthenticationLoginCheckTypeInterface): Promise<void> {
        const {testRunId, username, plainTextPassword, success, message} = params;

        await ApplicationDatabaseProvider.current.client.authenticationLoginCheck.create({
            data: {
                testRunId,
                username,
                password: EncryptionHelper.current.encrypt(plainTextPassword),
                success,
                message,
            },
        });
    }

    public async recordPageLoadCheck(params: PageLoadCheckTypeInterface): Promise<void> {
        const {testRunId, pageName, success, message, technicalReason, statusCode, durationMs} = params;

        await ApplicationDatabaseProvider.current.client.pageLoadCheck.create({
            data: {testRunId, pageName, success, message, technicalReason, statusCode, durationMs},
        });
    }

    public async recordIndexingFreshnessCheck(params: IndexingFreshnessCheckTypeInterface): Promise<void> {
        const {testRunId, resultCount, indexTime, machineTime, timeDifference, isFresh, message} = params;

        await ApplicationDatabaseProvider.current.client.indexingFreshnessCheck.create({
            data: {testRunId, resultCount, indexTime, machineTime, timeDifference, isFresh, message},
        });
    }

    // One check produces multiple rows (one per state) — write them all in a
    // single call rather than looping individual creates.
    public async recordQueueStatusChecks(rows: Array<QueueStatusCheckTypeInterface>): Promise<void> {
        await ApplicationDatabaseProvider.current.client.queueStatusCheck.createMany({
            data: rows,
        });
    }

    // Marks a check as "in flight" for the live progress feed — paired with
    // markCheckFinished, which must always run afterwards (success or fail),
    // or this row is left behind forever.
    public async markCheckStarted(testRunId: string, checkName: string): Promise<void> {
        await ApplicationDatabaseProvider.current.client.inProgressCheck.create({
            data: {testRunId, checkName},
        });
    }

    // deleteMany (not delete) - safe to call even if the row is already gone,
    // so callers can use this unconditionally in a finally block.
    public async markCheckFinished(testRunId: string, checkName: string): Promise<void> {
        await ApplicationDatabaseProvider.current.client.inProgressCheck.deleteMany({
            where: {testRunId, checkName},
        });
    }
}
