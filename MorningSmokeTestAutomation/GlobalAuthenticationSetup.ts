import {chromium, type FullConfig} from '@playwright/test';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import boxen from 'boxen';
import AuthenticationConfiguration from "./Configurations/AuthenticationConfiguration";
import ENValidator from "./Validators/ENValidator";
import EnvironmentValueNegativeException from "./Exceptions/EnvironmentValueNegativeException";
import ApplicationDatabaseService from "./Services/DatabaseServices/ApplicationDatabaseService";
import ApplicationDatabaseProvider from "./Providers/ApplicationDatabaseProvider";
import TestRunIdHelper from "./Helpers/TestRunIdHelper";
import SmokeEnvironmentHelper from "./Helpers/SmokeEnvironmentHelper";
import EnvironmentConfiguration from "./Configurations/EnvironmentConfiguration";

dotenv.config()

async function globalSetup(config: FullConfig) {
    try {
        const {username, password} = ENValidator.current.checkOrThrowRequiredENVariables();
        const currentEnvironment = SmokeEnvironmentHelper.current.resolveCurrentEnvironment();
        const envConfig = EnvironmentConfiguration.ALL[currentEnvironment];
        // The login path itself differs between environments (some are
        // /3dpassport/login, others /3dpassport/admin-tools/v2/login), so
        // envConfig.authUrl is the full page to navigate to - baseURL here
        // is just its origin, used for the post-login success URL check.
        const baseURL = new URL(envConfig.authUrl).origin;
        const testRunId = await ApplicationDatabaseService.current.startTestRun(currentEnvironment);
        TestRunIdHelper.current.write(testRunId);

        const headless = config.projects[0]?.use?.headless ?? true;
        const browser = await chromium.launch({headless});
        const page = await browser.newPage({ignoreHTTPSErrors: true});

        page.setDefaultTimeout(60000);
        page.setDefaultNavigationTimeout(60000);

        // Pinging the login page can fail two different ways: a network-level
        // failure (DNS, connection refused, TLS error, timeout) throws and
        // never produces an HTTP response, so statusCode stays null; an
        // HTTP-level response (even a 404/500) resolves normally with a real
        // status code.
        await ApplicationDatabaseService.current.markCheckStarted(testRunId, 'Authentication Ping');
        try {
            const response = await page.goto(envConfig.authUrl);
            const statusCode = response?.status() ?? null;
            const success = response?.ok() ?? true;
            const message = success
                ? `Page loaded successfully${statusCode ? ` (HTTP ${statusCode}).` : '.'}`
                : `Page responded with HTTP ${statusCode}.`;

            await ApplicationDatabaseService.current.recordAuthenticationPingCheck({testRunId, success, message, statusCode});
        } catch (pingError) {
            const message = pingError instanceof Error ? pingError.message : String(pingError);
            await ApplicationDatabaseService.current.recordAuthenticationPingCheck({testRunId, success: false, message, statusCode: null});
            throw pingError;
        } finally {
            await ApplicationDatabaseService.current.markCheckFinished(testRunId, 'Authentication Ping');
        }

        const usernameField = page.locator(AuthenticationConfiguration.usernameSelector);
        const passwordField = page.locator(AuthenticationConfiguration.passwordSelector);
        const submitButton = page.locator(AuthenticationConfiguration.submitSelector);

        await usernameField.waitFor({state: 'attached'});
        await usernameField.fill(username);
        await passwordField.waitFor({state: 'attached'});
        await passwordField.fill(password);
        await submitButton.waitFor({state: 'attached'});
        await submitButton.click();

        await ApplicationDatabaseService.current.markCheckStarted(testRunId, 'Authentication Login');
        try {
            const errorLocator = page.locator(AuthenticationConfiguration.errorSelector);
            const profileCompletionLocator = page.locator(AuthenticationConfiguration.profileCompletionSelector);

            // Some accounts land on a "complete your profile" panel instead
            // of successUrl after a perfectly valid login - still a success,
            // just a different landing page. Don't fill or submit that form;
            // its mere appearance is the signal.
            const loginOutcome = await Promise.race([
                page.waitForURL(`${baseURL}${AuthenticationConfiguration.successUrl}`, {timeout: 60000}).then(() => 'success' as const),
                profileCompletionLocator.waitFor({state: 'visible', timeout: 60000}).then(() => 'profile-completion' as const),
                errorLocator.waitFor({state: 'visible', timeout: 60000}).then(async () => {
                    const message = await errorLocator.textContent();
                    throw new Error(`Login failed: ${message?.trim() ?? 'unknown error'}`);
                }),
            ]);

            await ApplicationDatabaseService.current.recordAuthenticationLoginCheck({
                testRunId,
                username,
                plainTextPassword: password,
                success: true,
                message: loginOutcome === 'profile-completion'
                    ? 'Login succeeded (landed on profile-completion page).'
                    : 'Login succeeded.',
            });
        } catch (loginError) {
            const message = loginError instanceof Error ? loginError.message : String(loginError);
            await ApplicationDatabaseService.current.recordAuthenticationLoginCheck({
                testRunId,
                username,
                plainTextPassword: password,
                success: false,
                message,
            });
            throw loginError;
        } finally {
            await ApplicationDatabaseService.current.markCheckFinished(testRunId, 'Authentication Login');
        }

        await page.context().storageState({path: 'auth.json'});
        await browser.close();
        await ApplicationDatabaseProvider.current.disconnect();
    } catch (error) {
        if (error instanceof EnvironmentValueNegativeException) {
            console.error(boxen(
                `${chalk.white(error.message)}\n\n` +
                `${chalk.cyan('💡 How to fix:')}\n` +
                `${chalk.cyan('   1. Copy .env.example → .env')}\n` +
                `${chalk.cyan('   2. Fill in the required environment variables')}\n` +
                `${chalk.cyan('   3. Run the smoke tests again')}`,
                {
                    title: chalk.red.bold('❌ ENVIRONMENT CONFIGURATION'),
                    titleAlignment: 'center',
                    padding: 1,
                    margin: 1,
                    borderStyle: 'round',
                    borderColor: 'red',
                }
            ));
        } else {
            // Anything else (login failure, timeout, network error, ...) used to
            // be silently swallowed here — global setup would appear to succeed
            const actualError = error instanceof Error ? error : new Error(String(error));
            console.error(boxen(
                `${chalk.white(actualError.message)}\n\n` +
                `${chalk.dim(actualError.stack ?? '')}`,
                {
                    title: chalk.red.bold('❌ GLOBAL SETUP FAILED'),
                    titleAlignment: 'center',
                    padding: 1,
                    margin: 1,
                    borderStyle: 'round',
                    borderColor: 'red',
                }
            ));
        }

        await ApplicationDatabaseProvider.current.disconnect();
        process.exit(1);
    }
}

export default globalSetup;
