# HC-017 — Partner commissions receivable: what OpenBB and Brandfetch owe us, deal by deal

**Status:** Todo · **Phase:** 1 · **Depends on:** HC-016 · **Repo:** holy-corner ·
**Branch:** `hc-017-partner-commissions-receivable` · One ticket = one branch = one PR.

## Why this matters (for John)

The advisory partnerships pay when the partner's customers pay. That means Bruntsfield has to know,
per customer deal, when the partner first received cash, how much, in which contract year, and
whether the deal was a Notified Prospect. None of that exists anywhere today; the MSAs give an
audit right precisely because the partner holds the facts. This ticket is the receivable side of
the commission model: grassmarket already has the payable side (what a consultant earns from the
same deal).

## Context

- Terms from HC-012: OpenBB 30/20 white-label, 25 pilot, 24-month window; Brandfetch 15/10
  distribution, 7.5/7.5 redistribution (36 months), the creditable USD 5,000; renewal restarts at
  year-1 rates; MFN; audit right with 30-day cure.
- grassmarket `commissions.yaml` Stream A carries the **consultant's** share of the same deals
  (openbb 1500/1000 bps, brandfetch distribution 750/500, redistribution 375/375) — half of what
  the partner pays Bruntsfield. Grassmarket's `record_product_commission` takes `base_value`,
  `product_id`, `contract_year`; the caller supplies the period. Holy Corner is the natural caller.
- The MSAs' Notified Prospect mechanism: a Notice of Introduction, acceptance or deemed acceptance,
  then the prospect is protected. That is a register Holy Corner should hold so the 12-month
  attribution and the run-off can be checked.
- Elite Vault's win-probability scorer (`lib/ai/win-scorer.ts`: deterministic, explainable
  `reasons[]` and `missingInfo[]`) is a good shape for "how confident are we this deal will pay".

## Scope

- Migrations: `notified_prospects` (contract_id, organisation_id of the prospect, notice_sent_on,
  accepted_on | deemed_on, status ∈ proposed / accepted / rejected / expired), `customer_deals`
  (contract_id, notified_prospect_id, engagement_type matching the term's, first_cash_on, acv Money,
  renewal_of?, status), `partner_cash_reports` (customer_deal_id, period, cash_received Money,
  reported_on, source ∈ partner_statement / email / manual, document?, needs_review).
- Repository and engine: a cash report → an expected commission event (HC-016) at the right year's
  rate, window-checked, drawdown-applied for Brandfetch; a renewal deal restarts the window.
- Screens under **Money → Partner deals**: per partner contract, the Notified Prospect register,
  the deals with their windows drawn as a timeline (year 1 / year 2 / run-off), cash reports with
  the commission they generate, "what we can invoice now" per partner (feeds HC-014 as draft
  invoice lines), and a "window closing in 90 days" flag.
- A statement request: a generated letter (HC-019 later renders it) asking the partner for the
  period's cash report, gated as an external action (HC-042).

## Out of scope

- Reading partner statements automatically (HC-040's inbox handles documents). Paying consultants
  (grassmarket). The pilot/co-branded and strategic rate variants beyond the terms already on the
  record.

## Acceptance criteria

- [ ] A Notified Prospect for OpenBB accepted on a date, a deal with first cash on 1 Oct 2026 and
      a USD 100,000 cash report produce a USD 30,000 commission row in the ledger, visible on the
      deal timeline in year 1; a report dated in year 2 produces 20 %; outside the window, zero
      with a reason.
- [ ] The Brandfetch drawdown reduces receivable commission until USD 5,000 is consumed, shown as
      a running balance on the contract page.
- [ ] "What we can invoice now" for OpenBB lists the USD 30,000 with the deal and period; creating
      the invoice from it links the ledger row (HC-014).
- [ ] A deal whose window closes within 90 days shows the flag on the partner page and in Needs you.
- [ ] Screens at both sizes.

## Verification

`/review` + `/qa`. Engine tests for each rate cell, the window boundary (inclusive on the last day,
exclusive the day after), and the drawdown.
