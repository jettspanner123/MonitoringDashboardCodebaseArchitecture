// Applies one of prisma/manual-sql/*.sql directly via a plain pg connection -
// NOT `prisma db execute` (that hung indefinitely against the Supavisor
// pooler during this backend's first-ever use of it) and NOT `prisma
// migrate` (would collide with MorningSmokeTestAutomation's own tracked
// migration history in this same database). Usage:
//   bun run scripts/RunManualSql.ts prisma/manual-sql/001_add_push_notifications.sql
import 'dotenv/config';
import { readFileSync } from 'fs';
import { Client } from 'pg';

const filePath = process.argv[2];
if (!filePath) {
    console.error('Usage: bun run scripts/RunManualSql.ts <path-to-sql-file>');
    process.exit(1);
}

async function main(): Promise<void> {
    const sql = readFileSync(filePath, 'utf-8');
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
        await client.query(sql);
        console.log(`Applied ${filePath} successfully.`);
    } finally {
        await client.end();
    }
}

main().catch((error) => {
    console.error('Failed to apply SQL file:', error);
    process.exit(1);
});
