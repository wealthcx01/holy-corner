import { defineConfig, devices } from '@playwright/test';

/**
 * The UI gate (HC-006). The only check in this repository that sees a screen.
 *
 * Fountainbridge shipped thirty tickets with every automated gate green while its main screen was
 * 9,908 pixels tall against a design of 1,900, half of it finished work nobody needed to see. Lint,
 * typecheck, 1,459 unit tests and 250 browser tests were all passing throughout, and every one of
 * them was right: the sections were present, in the right order, with correct data. A screen can be
 * entirely correct and completely unusable, and only looking finds that (CLAUDE.md #11).
 *
 * So this job does two things no other check does. It renders every screen at both sizes and
 * uploads the pictures as an artefact somebody can open, and it asserts a HEIGHT CEILING per screen,
 * because height is a cheap proxy for "this shows more than it was meant to".
 *
 * It is a REQUIRED check from the first pull request. Fountainbridge left it advisory and a red one
 * merged itself (FB-124).
 */
const PORT = 3100;

export default defineConfig({
  testDir: './e2e',
  // Clears the readings manifest, so a run never reports a height from the run before it.
  globalSetup: './e2e/global-setup.ts',
  // One worker, no parallelism. The specs sign in and out of one server and a screenshot taken
  // while another test is navigating is a picture of the wrong thing.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    // Desktop at the size CLAUDE.md #11 names. Not `devices['Desktop Chrome']`'s default, because
    // the rule says 1440x1000 and a reading taken at another width is not the reading.
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
      testIgnore: /mobile\.spec\.ts/,
    },
    // The phone, at 393x851. Pixel 5 is Chromium-based, so CI installs one browser rather than two;
    // an iPhone profile would pull in WebKit for no gain at this size.
    { name: 'mobile', use: { ...devices['Pixel 5'] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      // The test door. BOTH are needed for the provider to exist, so a stray E2E_TEST_LOGIN=1 on a
      // real deployment is inert (HC-003). It is what lets the gate drive all four roles without a
      // live Google client.
      E2E_TEST_LOGIN: '1',
      E2E_TEST_LOGIN_SECRET: 'e2e-playwright-shared-secret',

      // Roles, supplied by environment because HC-004's table is empty in a fresh test database.
      // These four addresses are the gate's cast; every role assertion below names one of them.
      HC_ADMIN_EMAILS: 'john@bruntsfield.capital,john.gallagher@wealthcx.com',
      HC_WORKSPACE_DOMAIN: 'bruntsfield.capital',
      HC_ROLE_ASSIGNMENTS:
        'exec@bruntsfield.capital=exec,finance@bruntsfield.capital=finance,analyst@bruntsfield.capital=staff:advisory',

      // The second door, driven end to end. The hash is safe to commit precisely BECAUSE it is a
      // hash: of 'e2e-walkthrough-password-not-for-production', minted with
      // scripts/mint-password-login.mjs. Nothing about it works anywhere but here.
      HC_PASSWORD_LOGINS: 'walkthrough@bruntsfield.capital=scrypt:16384:8:1:39VC7JGDe8bpO3f-hhdagg:gitU4Iavd1Kdofzjvms2fzeMtur3f6brdELPzT1Ql40',

      // Pinned so anything dated is deterministic. Nothing reads it yet - the record arrives in
      // Phase 1 - and it is set now so the first screen that shows a date does not have to
      // introduce a clock to the gate at the same time as introducing the date.
      E2E_NOW: '2026-09-30T12:00:00Z',

      // NO DATABASE. The gate runs against a server with DATABASE_URL unset, on purpose: it is
      // testing screens, and a Postgres a screen does not read is a dependency that can only fail.
      // The role source falls back to the environment, which is the documented behaviour.
      AUTH_SECRET: 'e2e-test-secret-not-for-production-32ch',
      AUTH_TRUST_HOST: 'true',
      GOOGLE_CLIENT_ID: 'e2e-dummy',
      GOOGLE_CLIENT_SECRET: 'e2e-dummy',
    },
  },
});
