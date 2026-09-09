# HC-004 — The data layer: Postgres on Railway, migrations, one repository, PGLite for tests

**Status:** Todo · **Phase:** 0 · **Depends on:** HC-002 · **Repo:** holy-corner ·
**Branch:** `hc-004-the-data-layer` · One ticket = one branch = one PR.

## Why this matters (for John)

Elite Vault ran on one SQLite file and that was right for a demo. Holy Corner will have a long-running
server, background jobs reading Wise, and more than one person writing at once. It also has to hold
money, which means integers, currencies, and dates that are dates. This ticket lays the store every
Phase 1 ticket writes into, and the single door they all go through.

## Context

- grassmarket: Postgres on Railway (`DATABASE_URL` injected, normalised to psycopg 3), Alembic
  migrations run at boot (`healthcheckTimeout` raised to 300 because of that), one 5,700-line
  `Repository` class with `_assert_can_access` / `_require_self_or_admin`, `ScopeViolationError → 404`,
  and a boot refusal on SQLite, a placeholder secret, or a short secret in production.
- fountainbridge has no database. Its `@electric-sql/pglite` dev dependency is for tests.
- Elite Vault `db/index.ts` auto-runs pending migrations on connect from a `_migrations` table:
  simple, worth keeping. Its schema is almost all nullable `TEXT` with ISO strings for dates; that
  is the anti-pattern.
- Money: grassmarket's `Money` contract is `{amount_minor, currency, assumption_ref}` with
  banker's rounding in `earnings/commission.py`. Plan D5.

## Scope

- `pg` client, `DATABASE_URL`, a `lib/db/` module with a connection pool, and SQL migrations in
  `db/migrations/NNNN_slug.sql` applied by `npm run db:migrate` and at boot (recorded in
  `_migrations`). Boot refuses in production without `DATABASE_URL`, with a placeholder
  `AUTH_SECRET`, or with a secret under 32 characters.
- `lib/data/repository.ts`: the only place SQL lives. Every method takes a `Principal` first and
  scopes before it reads (`assertCanAccess`, `requireRole`). A `ScopeViolation` error the API layer
  turns into 404 with `{ detail: "Not found." }`.
- Migration 0001: `people` (id, email, display_name, role, pillars[], identities[] so John's two
  addresses are one person, created_at), `role_assignments` history, `activity_log` (actor, action,
  entity_type, entity_id, at, details jsonb) — the Elite Vault table, used from day one this time.
- Types for money and dates: `Money = { amountMinor: integer, currency: ISO-4217 }`, a `lib/money.ts`
  with `add` (refuses mixed currencies), `allocate` (banker's rounding, parts sum exactly), `format`.
  Dates are `date` / `timestamptz` columns, never text.
- PGLite for unit tests: the same migrations applied to an in-memory instance; a test helper
  `withTestDb()`. CI "Test" runs against it; no Postgres service in CI.
- `docs/data-model.md` started: the tables, what each is for, and the rule that every money column
  is `_minor` plus `_currency`.

## Out of scope

- Any domain table beyond people, roles and activity (HC-010 onwards). The contracts package
  (HC-005). Backups (HC-007 notes Railway's).

## Acceptance criteria

- [ ] `npm run db:migrate` applies 0001 to a fresh Railway Postgres and is idempotent.
- [ ] A unit test proves a `finance` principal reading a `staff`-only row gets `ScopeViolation`, and
      the API layer renders it as 404 with no detail.
- [ ] `allocate(1000 USD, [1,1,1])` returns three parts summing to exactly 1000; adding USD to GBP
      throws.
- [ ] Production boot with SQLite-shaped or placeholder config is refused with a plain message.
- [ ] The test suite runs on PGLite in CI in under a minute.

## Verification

`/review` + `/qa`. `npm test` output in the PR; the migration log from the Railway shell.
