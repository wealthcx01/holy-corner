# The data model

What Holy Corner stores, why each table is shaped the way it is, and the rules every later
migration follows. Started by HC-004 with the three tables everything else stands on; each Phase 1
ticket adds its own and a section here.

## The rules, before the tables

These are not style preferences. Each one is a defect somebody has already shipped.

**Money is two columns, always.** `<name>_minor BIGINT` and `<name>_currency CHAR(3)`, side by
side. Never a `NUMERIC`, never a float, never an amount without its currency next to it. An amount
is an integer of minor units, so USD 50.00 is stored as `5000`, and `lib/money.ts` is the only thing
that does arithmetic on it. Plan D5 and CLAUDE.md #4.

The reason is not pedantry. A float cannot hold 0.1 exactly, so a commission of 30 % computed on a
float drifts every time it is recomputed, and a column holding "50.00" with the currency two tables
away is an amount nobody can safely add to another one.

**Two currencies never meet in one sum.** `add` throws. Converting needs a rate, a rate needs a date
and a source, and an FX conversion is a recorded event, not something a helper does silently inside
a total.

**Dates are `date`; moments are `timestamptz`. Never text.** Elite Vault stored ISO strings in TEXT
columns, so every comparison was a string comparison that happened to work until a timezone or a
format changed.

**Identifiers are `text`, holding a slug or a uuid.** Not `bigserial`. The record is shared with two
other systems and a number that means something different in each of them is worse than a longer
key.

**Every table carries `created_at timestamptz NOT NULL DEFAULT now()`.**

**A change worth auditing is an append, not an update.** See `role_assignments` below.

## The tables (migration 0001)

### `people`

One row per person, whichever pillar met them first. `email` is the address they are known by,
lower-cased at write time so a lookup never has to guess about casing.

`identities` is an array of every OTHER address that is this same person. John has two, one of them
off the Workspace domain, and "who is this" must not depend on which one he signed in with. The
repository looks in both.

`pillars` is an array, and **an empty array means none, not all**. `lib/authz.ts` reads it the same
way. The safe reading of an unset scope is the empty one; the other reading hands a new account the
whole group because somebody left a column blank.

`role` is constrained to the four in the plan, rather than free text, because a typo in a role is
somebody silently holding none.

### `role_assignments`

Every role anybody has ever held, append-only, with who granted it and why.

**This is why `people.role` is a projection rather than the truth.** "Who gave this person access to
the group's money, and when" is a question that gets asked once, after something has gone wrong, and
an `UPDATE people SET role` destroys the answer before anybody thinks to ask it. The application
reads `people.role` because it is on the hot path of every request; the audit reads this table.
`Repository.assignRole` writes both in one transaction, because a projection that disagrees with its
history is worse than either alone.

`assigned_by` is `NOT NULL`. A role that assigned itself is the thing this table exists to make
impossible to claim.

### `activity_log`

What happened: an actor, an action, the thing it happened to, when, and a `jsonb` of detail.

Elite Vault had this table and never wrote to it. This one is written from the first role change.
HC-034 reads it, joined with the two studios' own records, to answer "what happened this week".

### `_migrations`

Which migrations have run. Created by the migrator itself.

## How migrations run

`db/migrations/NNNN_slug.sql`, applied in filename order, which is why they are numbered.

They run in two places: `npm run db:migrate` when you want to do it deliberately and watch, and **at
boot**, so a deploy can never reach a schema it was not built for. Elite Vault's auto-migrate on
connect is the one piece of its data layer worth keeping.

**Idempotent by construction.** A migration with a row in `_migrations` is skipped. Each one runs
inside a transaction together with its bookkeeping row, so a migration that fails half way leaves
neither half behind: there is no "partly applied" state to reason about at three in the morning.
There is a test that proves it, by running a deliberately broken migration and checking the table it
created first is gone.

## Tests run against a real Postgres

`lib/db/testing.ts` gives every test a migrated, empty database using PGLite, which is Postgres
compiled to WebAssembly. **The same migration files and the same repository run in the test as in
production.** A stubbed database tests the stub, and the one thing worth knowing about a query is
whether Postgres accepts it.

CI therefore needs no Postgres service. The whole suite runs in a plain Node job, in about twenty
seconds.

## Everything goes through the repository

`lib/data/repository.ts` is the only place SQL lives (plan D3, CLAUDE.md #8). Feature code never
issues a query.

**Every method takes a `Principal` first.** Not a field, not read from a request context, not
optional. A method that forgets to scope is one somebody wrote while looking straight at the
principal they did not use, and every call site has to say whose request this is.

**A scope violation is a 404, never a 403**, and a row that does not exist and a row you may not see
give the same answer. Anything else is an existence oracle: ask for ids until one of them answers
differently. A 403 on `/record/organisations/openbb` confirms OpenBB is a counterparty of ours,
which is exactly the kind of thing HC-056 exists to stop leaking.

**This is the second gate, not the only one.** HC-003's `requireSection` gates a section in the
page; this gates a row before it is read. A route added in a hurry that forgets the first still
cannot get past the second.
