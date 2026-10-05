import SmokeEnvironmentNameType from "../Types/SmokeEnvironmentNameType";
import EnvironmentValueNegativeException from "../Exceptions/EnvironmentValueNegativeException";
import EnvironmentConfiguration from "../Configurations/EnvironmentConfiguration";

export default class SmokeEnvironmentHelper {
    public static current = new SmokeEnvironmentHelper();

    private static readonly VALID_ENVIRONMENT_NAMES = Object.keys(EnvironmentConfiguration.ALL) as SmokeEnvironmentNameType[];

    // Both GlobalAuthenticationSetup.ts (picking the right login URL) and
    // SmokeTest.spec.ts (picking the right page config) need to agree on
    // which environment is being targeted - SMOKE_ENV is the single source
    // of truth for both, set per npm script (see package.json's
    // test:headed:<env> scripts).
    public resolveCurrentEnvironment(): SmokeEnvironmentNameType {
        const value = process.env.SMOKE_ENV;

        if (!value) {
            throw new EnvironmentValueNegativeException(
                `Missing SMOKE_ENV. Run one of the test:headed:<env> scripts (e.g. test:headed:qa) ` +
                `instead of test:headed directly, so the right environment gets picked.`,
                false
            );
        }

        if (!SmokeEnvironmentHelper.VALID_ENVIRONMENT_NAMES.includes(value as SmokeEnvironmentNameType)) {
            throw new EnvironmentValueNegativeException(
                `Unrecognized SMOKE_ENV "${value}". Expected one of: ${SmokeEnvironmentHelper.VALID_ENVIRONMENT_NAMES.join(', ')}.`,
                false
            );
        }

        return value as SmokeEnvironmentNameType;
    }
}
