# Running MorningSmokeTestAutomation On A Fresh Machine

`MorningSmokeTestAutomation` is not a standalone repo — it's a subfolder inside
`MonitoringDashboardCodebaseArchitecture`. A plain clone + test command will
**not** work out of the box; follow these steps in order.

1. **Clone** `MonitoringDashboardCodebaseArchitecture`, then `cd MorningSmokeTestAutomation`.

2. **Create `.env` before installing.** Copy `.env.example` → `.env` and fill
   in real values *first* — Prisma's `postinstall` hook runs `prisma generate`
   during `npm install`, which needs `DATABASE_URL`/`DIRECT_URL` present.
   - `SMOKE_USER`, `SMOKE_PASS` — a working 3DPassport login for the target environment
   - `DATABASE_URL` — Supabase pooler connection, port 6543
   - `DIRECT_URL` — Supabase direct connection, port 5432
   - `DB_ENCRYPTION_KEY` — generate with:
     ```
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```

3. **`npm install`**

4. **`npx playwright install chromium`** — browsers are not installed
   automatically by any script. This is required even if the machine already
   has Edge or Chrome installed: `playwright.config.ts` sets no `channel` on
   the `chromium` project, so Playwright always uses its own managed
   Chromium build, never a system browser.

5. **Migrate the database schema** if the target Supabase DB is fresh:
   ```
   npx prisma migrate deploy
   ```
   No npm script does this for you.

6. **VPN/network access** to Atlas Copco's internal hosts (`*.atlascopco.group`)
   — the tests hit internal 3DPassport/3DEXPERIENCE environments directly.

7. **Run the tests**:
   ```
   npm run test:headed:production
   npm run test:headed:qa
   npm run test:headed:training
   npm run test:headed:dev1
   npm run test:headed:testing
   npm run test:headed:dev2
   ```
   These set `SMOKE_ENV` for you. Plain `npm run test` / `npm run test:headed`
   only work if `SMOKE_ENV` is already set in `.env` yourself.

## Notes

- `auth.json` (the Playwright login session) is gitignored and not something
  you create manually — Playwright's global setup generates it automatically
  on the first successful login.
- There is no README in the repo; this list was pieced together from
  `.env.example`'s comments and the runtime validation error messages in
  `ENValidator`/`EncryptionHelper`/`GlobalAuthenticationSetup.ts`.
- View a report after a run with `npm run report`.
