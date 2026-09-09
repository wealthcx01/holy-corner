# HC-016 — The revenue engine: expected cash events from terms, the ledger, multi-currency

**Status:** Todo · **Phase:** 1 · **Depends on:** HC-012, HC-014 · **Repo:** holy-corner ·
**Branch:** `hc-016-the-revenue-engine` · One ticket = one branch = one PR.

## Why this matters (for John)

"What are we owed, and when?" needs the contracts turned into dated cash events: a commitment
payment on signature, a commission each time a partner reports customer cash, a retainer each
month, and for a Foundry venture, nothing until a milestone. Elite Vault's three engines did
exactly this for LabCI's statements of work and they are pure functions with provenance and
confidence on every row. This ticket ports them to Bruntsfield's terms and gives every row a real
lifecycle from forecast to paid.

## Context

- Elite Vault `lib/engines/once-off-schedule.ts` (milestones with trigger offsets and confidence),
  `mrr-schedule.ts` (one row per month with a four-tier start-date fallback and a recorded
  `method`), `ledger.ts` (one row per expected cash event, monthly bucket, matched against LSEG
  purchase orders, aggregate variance stamped on the first row only — a defect to fix). All pure,
  array in / array out, called by "select all → truncate → regenerate" routes. Status was only
  `FORECAST | DUE`; there was no invoiced or paid state. Payment terms were hardcoded net-30 and
  FX was a hardcoded table.
- `invoice_rules` in Elite Vault (cadence, timing, offsets) is the right idea; here the source is
  the contract's `PaymentTerms` term with a default per currency.
- grassmarket computes the consultant's share with the same period logic (`contract_year` measured
  from first cash received under the Qualifying Deal; the caller supplies the period). Reuse the
  vocabulary so HC-018 can line the two up.
- Plan D5: integers, currency per row, no cross-currency sums, FX as events.

## Scope

- `lib/engines/expected-cash.ts`: `expectedCashEvents(contract, terms, facts, now)` → rows of
  `{ contract_id, term_id, kind ∈ commitment / commission / retainer / milestone / expense_recovery,
  expected_on, amount Money, basis (what it was computed from), method, confidence, status }`.
  Rules: `CommitmentPayment` → one event on the schedule's signed date (or dated_on if unsigned,
  confidence lower); `CommissionRate` → one event per reported customer cash receipt (HC-017's
  facts) at the year's rate within the window, reduced by any creditable drawdown; `Milestone` →
  no cash, a tracked row with progress; `RenewalRule` → a note on the last event in the window.
- Migration: `revenue_ledger` (the rows above plus `invoice_id?`, `payment_id?`, `status ∈
  forecast / due / invoiced / part_paid / paid / written_off`, `regenerated_at`), `fx_events`
  (from, to, rate, source, at, applied_to).
- Regeneration: `POST /api/revenue/regenerate` (admin/finance) rebuilds forecast and due rows from
  terms and facts, never touches rows that are invoiced or beyond, and reports what changed.
- Status: derived forward — an invoice created from a row moves it to invoiced; a payment matched
  moves it to part_paid or paid. Reversal only by void/write-off, audited.
- Screens under **Money → Revenue**: the ledger (filters by organisation, kind, status, month),
  a monthly chart (Elite Vault `TimelineChart` in house tokens: expected vs invoiced vs paid, one
  currency at a time), a "what changed" panel after regeneration.
- `docs/data-model.md` gains the ledger and the rules in words.

## Out of scope

- Commission facts from partners (HC-017 supplies them; this ticket ships with fixture facts).
  Consultant payables (HC-018). Cost side (HC-020). Accounting export (later).

## Acceptance criteria

- [ ] From the seeded contracts alone the ledger holds exactly two rows: the OpenBB and Brandfetch
      commitment payments, both `invoiced` (linked to INV-001/INV-002), and a milestone row for
      The Reset with no amount.
- [ ] Given a fixture fact "OpenBB reports USD 100,000 cash received from a white-label exchange
      customer on 1 Oct 2026", regeneration adds a forecast commission row of USD 30,000 for
      contract year 1 with basis and method stated; a second fact 13 months later prices at 20 %;
      a fact 25 months later prices to zero with the reason "outside the 24-month window".
- [ ] The same for Brandfetch reduces the first commission by the USD 5,000 drawdown and records it.
- [ ] Regeneration never modifies an invoiced or paid row (a test tries).
- [ ] No query in the ledger sums two currencies; the chart shows one currency with a switch.
- [ ] Ledger and chart at both sizes.

## Verification

`/review` + `/qa`. Engine unit tests are pure and cover every rule above; the PR lists them.
