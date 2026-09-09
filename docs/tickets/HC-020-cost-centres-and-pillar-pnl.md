# HC-020 — Cost centres and a P&L per pillar: expenses, budgets, margin

**Status:** Todo · **Phase:** 1 · **Depends on:** HC-016, HC-015 · **Repo:** holy-corner ·
**Branch:** `hc-020-cost-centres-and-pillar-pnl` · One ticket = one branch = one PR.

## Why this matters (for John)

Revenue by pillar is half the picture. The Foundry has no revenue yet and real spend (Bruntsfield
funds The Reset's platform, hosting and AI under the agreement); Advisory has commitment payments in
and consultant payables out. A P&L per pillar is the number the Executive Management team will ask
for first. Fountainbridge already tracks department budget envelopes per venture; SD3 is building
spend intake from Wise. This ticket maps every expense to a pillar and, where it belongs, to a
contract or venture.

## Context

- PRD §2.4 Cost Centres: map every expense to a pillar, optionally to an engagement; P&L per pillar.
- fountainbridge `lib/budgets.ts` + `ventures/budgets/` (department envelopes, committed spend in
  integer pence, FB-054) — read through HC-032, not re-entered.
- HC-015's activity feed is the expense source of truth for card and transfer spend; SD3-0065's
  intake design (redaction, untrusted narratives) applies.
- `CostCentre`, `Expense` from HC-005.

## Scope

- Migrations: `cost_centres` (pillar, name, venture or contract link?), `expenses` (activity_id?,
  cost_centre_id, category, amount Money, on, counterparty text redacted, allocation ∈ proposed /
  confirmed), `budgets` (cost_centre_id, period, envelope Money).
- A rule table for auto-allocation (counterparty pattern → cost centre) with every allocation a
  proposal until confirmed by `finance` or `admin`; a background classifier (ADR-0001's background
  model) suggests a cost centre for the rest, shown as AI-drafted.
- Screens under **Money → P&L**: per pillar per month, revenue (HC-016 ledger, paid and invoiced
  shown separately) and expenses (confirmed), margin, one currency per table with the FX events
  listed; per venture, Bruntsfield's funded spend against the fountainbridge envelope; an
  unallocated-expenses queue.
- Export: CSV per period for the accountant.

## Out of scope

- Accounting-system sync. Payroll. Tax. Anything that is not cash in or out of Wise plus the
  fountainbridge envelopes.

## Acceptance criteria

- [ ] With fixture activities (a Railway charge, an Anthropic charge, a consultant transfer, a
      Google Workspace charge), the rules allocate the first two to Foundry / The Reset, the third
      to Advisory / OpenBB, and leave the fourth in the queue with an AI suggestion marked as such.
- [ ] The Advisory P&L for August 2026 shows USD 10,000 invoiced, USD 0 paid (until Wise says
      otherwise), and the confirmed expenses; the Foundry P&L shows spend against The Reset's
      envelope from fountainbridge.
- [ ] No expense reaches a P&L without a confirmed allocation; the queue count appears in Needs you.
- [ ] Screens at both sizes.

## Verification

`/review` + `/qa`. Allocation rule tests; the CSV opened and checked.
