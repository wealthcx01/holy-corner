# HC-007 — Deploy: the Railway service, health, the domain, the OAuth client, the env table

**Status:** Todo · **Phase:** 0 · **Depends on:** HC-006 · **Repo:** holy-corner ·
**Branch:** `hc-007-deploy-to-railway` · One ticket = one branch = one PR.

## Why this matters (for John)

A studio that only runs on a laptop is not a studio. From this ticket on, `main` is live at a real
address John can open on a phone, and every later screen is checked there, not only in CI.

## Context

- fountainbridge: one Railway service from GitHub, `railway.json` (NIXPACKS, `npm run start`,
  `/api/health`, `ON_FAILURE` × 3), `docs/deploy.md` with an env-var table, a Google OAuth client
  with the production callback, an uptime monitor, and "Running against the real deployment"
  (`railway run --service <name> npm start`) added after a broken composer went unnoticed for weeks.
- grassmarket: two services (backend from GitHub, frontend by `railway up --path-as-root` from a
  workflow), `healthcheckTimeout = 300` because migrations run at boot.
- The domain: `os.bruntsfieldcapital.com` per grassmarket's portal table. Setting DNS is a human
  step; the ticket documents it and verifies it.
- HC-001 reserved the project and the Postgres add-on.

## Scope

- Connect the service to `wealthcx01/holy-corner` `main`; migrations run at boot (HC-004);
  `healthcheckTimeout` 300; `/api/health` returns build SHA and migration head.
- Production variables set by hand from `.env.example` (documented in `docs/deploy.md`, values never
  in the repo): `AUTH_SECRET`, `GOOGLE_*`, `HC_ADMIN_EMAILS` with both of John's addresses,
  `DATABASE_URL` (injected), `HC_WORKSPACE_DOMAIN`.
- A Google OAuth client for `https://os.bruntsfieldcapital.com/api/auth/callback/google` (and the
  Railway-generated domain until DNS lands), in the Bruntsfield Workspace project.
- `docs/deploy.md`: the env table, the DNS record, "running against the real deployment", the
  Railway backup setting for Postgres, and the rollback command.
- An uptime check on `/api/health` (the same tool fountainbridge uses).
- `README.md` "Seeing it yourself" section with the URL and the two sign-in doors.

## Out of scope

- Any data seeding (HC-008). A staging environment (one environment until there is a reason).

## Acceptance criteria

- [ ] `https://os.bruntsfieldcapital.com/login` renders the house login page; John signs in with
      Google and lands on `/` as admin, on a phone.
- [ ] `/api/health` on production reports the deployed SHA equal to `origin/main`.
- [ ] A deliberately failing migration on a branch does not reach production (the deploy is
      refused by the healthcheck, and the log says why).
- [ ] `docs/deploy.md` lists every variable the app reads; a script (`scripts/env-check.mjs`) diffs
      `.env.example` against `process.env` reads in the code and fails CI on a gap.

## Verification

`/qa` against production. Screenshots from the phone in the PR.
