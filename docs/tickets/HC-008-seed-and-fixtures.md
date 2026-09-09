# HC-008 — Seed and fixtures: the commercial record as data, and a demo mode

**Status:** Todo · **Phase:** 0/1 · **Depends on:** HC-005, HC-007 · **Repo:** holy-corner ·
**Branch:** `hc-008-seed-and-fixtures` · One ticket = one branch = one PR.

## Why this matters (for John)

The first time Holy Corner is opened it should already know about OpenBB, Brandfetch and The Reset,
the two invoices, and what each contract says. Otherwise the first week is data entry, and the
screens are judged against empty tables. At the same time, grassmarket's rule stands: real client
data enters production only, never a committed fixture. So this ticket does two different things
and keeps them apart.

## Context

- `docs/commercial-record.md` holds every fact, read from the signed documents.
- grassmarket: `scripts/seed_dev.py` (CI/local), `scripts/seed_demo.py` (one demo advisor holding
  a coherent story, every record DEMO-provenance and watermarked, idempotent, GRS-0208), and the
  rule "no client data is copied into this repo" (`docs/ESTATE-RECONCILIATION.md`).
- fountainbridge: fixture directories per data source, injected by env, and `E2E_NOW`.
- The real PDFs live in OneDrive and Downloads. They are uploaded through the app into scoped
  storage (HC-012), not committed.

## Scope

- `scripts/seed-demo.mjs`: a fictional group with the same *shapes* as the real book — two advisory
  partner contracts with different commission structures (one creditable commitment payment, one
  not), one Foundry venture with a milestone and an equity split, three invoices in three states,
  two payments, one unmatched receipt — every row `provenance = demo`, watermarked in the UI.
  Idempotent: running twice produces identical counts (a test asserts it).
- `scripts/seed-production.mjs`: an **operator** script, run once by hand against production with
  the real values typed from `docs/commercial-record.md`, that creates the organisations, people,
  contracts, terms and invoices and prints what it created. It refuses to run against a database
  that already has a non-demo organisation. It never reads the PDFs; those are uploaded in HC-012.
- Fixture JSON under `e2e/fixtures/` for the UI gate, generated from the demo seed so the two
  cannot drift.
- A "Demo data" banner component shown whenever any rendered row has `provenance = demo`.

## Out of scope

- Uploading the signed PDFs (HC-012). Any real value in a committed file: names of real
  counterparties appear only in `docs/commercial-record.md` and in the operator script's prompts,
  never in fixtures.

## Acceptance criteria

- [ ] `npm run seed:demo` twice gives identical row counts; every demo row carries the watermark.
- [ ] The operator script, run against production by John, creates exactly three organisations,
      four people, seven contracts (two MSAs, two schedules, the agreement, the term sheet, the
      service schedule), their terms, and two invoices; the summary it prints matches the record.
- [ ] The operator script refuses to run a second time.
- [ ] The UI gate runs on the fixture set, not on demo seed at runtime.

## Verification

`/qa`. The operator script's printed summary pasted into the PR, with values redacted where they
name amounts other than the two USD 5,000 invoices already on the record.
