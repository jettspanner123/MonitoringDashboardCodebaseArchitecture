import * as fs from 'fs';
import * as path from 'path';

// GlobalAuthenticationSetup.ts and SmokeTest.spec.ts run in separate
// processes — Playwright provides no built-in way to share a value between
// them, so the testRunId is handed off via this small file instead. Global
// setup always finishes before any test worker starts, so the write always
// completes before any read is attempted.
const FILE_PATH = path.join(__dirname, '..', '.current-test-run-id');

export default class TestRunIdHelper {
    public static current = new TestRunIdHelper();

    public write(testRunId: string): void {
        fs.writeFileSync(FILE_PATH, testRunId, 'utf-8');
    }

    public read(): string {
        if (!fs.existsSync(FILE_PATH)) {
            throw new Error(`Missing ${FILE_PATH} — did global setup run before this test?`);
        }
        return fs.readFileSync(FILE_PATH, 'utf-8').trim();
    }
}
