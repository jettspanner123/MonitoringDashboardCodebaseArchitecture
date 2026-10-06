import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { Environment } from '@prisma/client';
import ApplicationDatabaseProvider from '../../../Providers/ApplicationDatabaseProvider';
import ValidationCException from '../../../Exceptions/ValidationCException';

class RunTriggerCON {
    // __dirname here is .../MonitoringDashboardOrchestratorServiceLayerMSC/src/Features/Runs/Services
    // (or the mirrored dist/ path once built) - five levels up is the monorepo
    // root, where the per-environment "smoke:test:headed:<env>" scripts live.
    public static readonly REPO_ROOT = path.resolve(__dirname, '../../../../..');

    public static readonly SCRIPT_BY_ENVIRONMENT: Record<Environment, string> = {
        PRODUCTION: 'smoke:test:headed:production',
        QA: 'smoke:test:headed:qa',
        TESTING: 'smoke:test:headed:testing',
        TRAINING: 'smoke:test:headed:training',
        DEV1: 'smoke:test:headed:dev1',
        DEV2: 'smoke:test:headed:dev2',
    };

    // GlobalAuthenticationSetup.ts creates its TestRun row as the very first
    // thing it does, before even navigating anywhere - this is just headroom
    // for process/Prisma-client startup, not for the login itself.
    public static readonly RUN_DISCOVERY_TIMEOUT_MS = 20000;
    public static readonly RUN_DISCOVERY_POLL_INTERVAL_MS = 500;
}

// Spawns the existing MorningSmokeTestAutomation npm scripts directly - the
// same ones you'd run by hand (`bun run smoke:test:headed:<env>`) - rather
// than reimplementing anything about how the suite runs. Only one run is
// allowed at a time: the suite's own TestRunIdHelper hands the run id between
// processes via a single flat file (.current-test-run-id), so two overlapping
// runs would corrupt each other's handoff.
export default class RunTriggerService {
    public static current = new RunTriggerService();

    private activeProcess: ChildProcess | null = null;
    private activeEnvironment: Environment | null = null;

    public isRunActive(): boolean {
        return this.activeProcess !== null;
    }

    // Resolves once the triggered run's own TestRun row shows up (so the
    // caller has a testRunId to subscribe the live-progress feed to) - not
    // once the run itself finishes, which can take many minutes.
    public async triggerRun(environment: Environment): Promise<string> {
        if (this.activeProcess) {
            throw new ValidationCException(
                `A run is already in progress (environment: ${this.activeEnvironment}). Wait for it to finish before starting another.`
            );
        }

        const triggeredAt = new Date();
        const scriptName = RunTriggerCON.SCRIPT_BY_ENVIRONMENT[environment];

        const child = spawn('bun', ['run', scriptName], {
            cwd: RunTriggerCON.REPO_ROOT,
            shell: true,
            stdio: 'ignore',
        });

        this.activeProcess = child;
        this.activeEnvironment = environment;

        child.on('exit', () => {
            this.activeProcess = null;
            this.activeEnvironment = null;
        });

        return this.waitForTestRunId(environment, triggeredAt);
    }

    private async waitForTestRunId(environment: Environment, triggeredAt: Date): Promise<string> {
        const deadline = Date.now() + RunTriggerCON.RUN_DISCOVERY_TIMEOUT_MS;

        while (Date.now() < deadline) {
            const run = await ApplicationDatabaseProvider.current.client.testRun.findFirst({
                where: { environment, createdAt: { gte: triggeredAt } },
                orderBy: { createdAt: 'desc' },
            });
            if (run) return run.id;
            await new Promise((resolve) => setTimeout(resolve, RunTriggerCON.RUN_DISCOVERY_POLL_INTERVAL_MS));
        }

        throw new ValidationCException(
            'Triggered the run, but timed out waiting for it to start up. It may still be starting - check back shortly.'
        );
    }
}
