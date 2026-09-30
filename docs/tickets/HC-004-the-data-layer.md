# HC-004 — The data layer: Postgres on Railway, migrations, one repository, PGLite for tests

**Status:** Done · **Phase:** 0 · **Depends on:** HC-002 · **Repo:** holy-corner ·
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

- [x] `npm run db:migrate` applies 0001 and is idempotent: a second run applies nothing, proved by
      a test. **Verified against real Postgres, but NOT against the Railway instance** — see
      "What could not be verified here" below.
- [x] A `finance` principal reading another person's row gets `ScopeViolation`, and it renders as
      404 with a body of `{ detail: "Not found." }`. A row that does not exist and a row you may not
      see give the SAME answer, so the two cannot be told apart by trying.
- [x] `allocate(1000 USD, [1,1,1])` returns 334, 333, 333, summing to exactly 1000. Held across
      six awkward amount-and-weight combinations, not just the one in the criterion. Adding USD to
      GBP throws, and says why.
- [x] Production boot with a SQLite-shaped URL, no URL, or a missing, short or placeholder secret
      is refused with a message naming the variable and what to do about it.
- [x] The whole suite runs on PGLite with no Postgres service in CI, in **19 seconds**.

## Verification

`/review` + `/qa`. `npm test` output in the PR; the migration log from the Railway shell.


## What building it turned up

**A money library that showed yen at a hundredth of its value.** `format` divided by 100, which is
right for pounds, dollars and francs and wrong for Japanese yen, which has no minor unit at all.
`minorUnitsPerMajor` asks `Intl` rather than keeping a table of currency exponents here, because a
table is one more thing to maintain and get wrong. Caught by writing the test before believing the
code.

**Migrations could not live in `instrumentation.ts`.** Next traces that file for BOTH runtimes, and
the edge runtime has no `fs`, no `path` and no TCP sockets, so bundling the Postgres driver for it
fails the build inside `pg-connection-string`. The `NEXT_RUNTIME === 'nodejs'` guard does not help:
the guard runs at runtime and the trace happens at build time, and `serverExternalPackages` does not
reach the edge compilation.

They run in the START COMMAND instead, `npm run db:migrate && npm run start` in `railway.json`. That
is still "at boot" in the sense that matters, because the server does not start until the migration
succeeds, and it is better twice over: a failed migration stops the deploy with the migration's own
error rather than a health check timing out, and the driver never enters the bundle. It is also what
grassmarket does, which is why HC-007 notes its health check timeout is raised to 300 seconds.

**A refusal that said what was wrong but not what to do.** The short-secret message named the
variable and the length and stopped there. A test asserting the message contains `openssl rand`
failed, and the test was right: a refusal a person cannot act on is a refusal they work around.

## What could not be verified here, and why

The first criterion asks for `npm run db:migrate` against **a fresh Railway Postgres**. It has been
run against real Postgres — PGLite is Postgres compiled to WebAssembly, running the same migration
files through the same migrator — and it is idempotent there.

It has NOT been run against the Railway instance HC-001 provisioned. That service publishes only
`postgres.railway.internal`, which resolves inside Railway's own network and nowhere else. Reaching
it from the development VM would mean enabling a public TCP proxy on the database, and **exposing
the group's database to the internet to satisfy a test is not a trade worth making**, least of all
without asking.

It gets verified for free at HC-007. That ticket connects the service, and the start command runs
the migration inside Railway's network on the first deploy, where the internal hostname resolves. A
failure there stops the deploy and says so.
