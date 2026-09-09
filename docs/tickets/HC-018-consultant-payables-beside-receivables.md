# HC-018 — Consultant payables beside receivables: gross margin per deal, pay-when-paid closed

**Status:** Todo · **Phase:** 1 · **Depends on:** HC-017, HC-031 · **Repo:** holy-corner, plus a
small companion in grassmarket · **Branch:** `hc-018-consultant-payables-beside-receivables` ·
One ticket = one branch = one PR per repo.

## Why this matters (for John)

The February PRD asked for one number the Advisory business runs on: consultant payables against
gross revenue, per engagement, so the margin is visible. Grassmarket computes what each consultant
is owed (v7, two streams, banker's rounding, pay-when-paid) and gates a line's move to `paid` on
`client_paid_on`. Holy Corner knows when the client paid, because it read Wise. This ticket puts
the two sides on one screen and closes the loop so that a receipt here tells grassmarket the line
can be paid.

## Context

- grassmarket `earnings.py` routes, all admin-gated on the write side and API-only today:
  `POST /earnings/commissions/product`, `/commissions/consultancy`, `/commissions/{id}/payment`,
  `/commissions/{id}/client-paid`, `/recovery-fees/{id}/claim`; reads `GET /earnings/...` scoped
  to self unless admin. Its docstring: "the cross-advisor aggregate is Holy Corner scope."
- `CommissionLine` carries `content_hash`, `stream`, `product_id`, `contract_year`, `window_end`,
  `client_paid_on`, `payment_status ∈ pending / invoiced / paid`; `EarningsSummary` per consultant.
- HC-031 gives Holy Corner an admin identity against grassmarket's API.
- The pay-when-paid seam: when HC-015 matches a payment to an invoice that was raised for a
  customer deal, the consultant lines on that deal can advance. Grassmarket requires `client_paid_on`
  set first; Holy Corner sets it through the existing endpoint with the admin identity, as a
  proposed external action approved by a person (D9: writes only through the studio's own gated
  paths).

## Scope

- **grassmarket companion:** `GET /earnings/admin/lines?product_id&period` returning every
  consultant's lines (admin only, paginated, audited as an admin read) — the aggregate the
  docstring reserved for Holy Corner. Nothing else changes there.
- Holy Corner: `lib/connectors/grassmarket/earnings.ts` (read lines, record client-paid) over
  HC-031's client.
- Screen under **Money → Margin**: per partner deal or engagement, receivable (HC-017) on the left,
  consultant lines on the right, margin per row and per period, in one currency per table; per
  consultant, what is pending, invoiced, paid and blocked on client payment; the recovery fee lines.
- The loop: a payment matched (HC-015) to an invoice raised against a deal creates a proposed action
  "tell the Advisory Studio the client paid on <date> for <deal>"; approval (HC-042) calls
  grassmarket's `client-paid` endpoint; the result is recorded on both sides.
- Consultant statements: link out to grassmarket's `.docx` statement; no second renderer.

## Out of scope

- Computing consultant commission here (grassmarket does). Paying consultants (a human, in Wise,
  recorded afterwards as an expense in HC-020). Recovery-fee attribution decisions.

## Acceptance criteria

- [ ] For the fixture OpenBB deal (USD 100,000 cash, year 1) the margin screen shows receivable
      USD 30,000, consultant line USD 15,000 (from grassmarket's config), margin USD 15,000, and
      says "not yet invoiced" until HC-014's invoice exists.
- [ ] Matching the payment produces the proposed action; approving it advances the grassmarket
      line's `client_paid_on`; refusing it leaves both untouched; the event trail shows both.
- [ ] The grassmarket admin read appears in grassmarket's audit log with the Holy Corner identity.
- [ ] No cross-currency total anywhere on the screen.
- [ ] Screens at both sizes.

## Verification

`/review` on both PRs, `/qa` against grassmarket staging.
