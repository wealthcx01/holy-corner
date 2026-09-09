# HC-005 — bcap-contracts for the hub: new types, vendored schemas, generated TypeScript, a parity check

**Status:** Todo · **Phase:** 0 · **Depends on:** HC-004 · **Repo:** holy-corner, plus grassmarket
(`packages/bcap_contracts` only) · **Branch:** `hc-005-bcap-contracts-for-the-hub` here and a
companion `hc-005-hub-contracts` PR into grassmarket · One ticket = one branch = one PR per repo.

## Why this matters (for John)

The one thing that lets Holy Corner read the Advisory Studio and the Foundry Studio without adapters
is that all three describe an engagement, a consultant, a venture or an approval with the same
words. That shared dictionary is `bcap-contracts`, and it already calls itself "the future Holy
Corner API surface". It has no word yet for a contract, an invoice, a payment or an organisation.
This ticket adds them there, and makes this repo consume the dictionary properly: generated, not
hand-typed, because both studios hand-typed theirs and both drifted.

## Context

- `packages/bcap_contracts` in the grassmarket repo, version 0.2.0, Pydantic v2 → JSON Schema
  (`scripts/generate_schemas.py`, `EXPORTED_MODELS` in `schemas.py`), parity enforced by a
  pre-commit hook and a CI `git diff --exit-code`. 122 schemas. Present and reusable: `Money`,
  `Role`, `ConsultantTier`, `AssessorLevel`, `JWTClaims`, `Consultant`, `Prospect`, `Contact`,
  `CompanyEntity`, `Engagement`, `EngagementStatus`, `CommissionLine`, `PaymentStatus`,
  `EarningsSummary`, `AuditEvent`, `Venture`, `Department`, `Lane`, `Ticket`, `Approval`, `RunReport`.
  Absent: Invoice, Contract, Payment, Person, Organisation, CostCentre.
- The precedent for a sibling repo changing the package is fountainbridge's FB-002 (PR #181 into
  grassmarket): its own prefix, additive only, a `CHANGELOG` entry, a version bump.
- Neither studio generates TypeScript from the schemas; grassmarket `frontend/lib/types.ts` and
  fountainbridge `tools/ticket-parser/src/types.ts` are hand-written and stale. Use
  `json-schema-to-typescript` here so the generated file is the contract.
- Elite Vault's `sow_intake`, `invoices`, `payments` and `contracts` tables are naming references for
  what a contract-derived record needs (LLM provenance columns, `needs_review`, milestone JSON).
- `docs/commercial-record.md` is the test: every term in it must be expressible.

## Scope

**In grassmarket (`packages/bcap_contracts`, companion PR, additive, version 0.3.0):**

- `organisations.py`: `Organisation` (id, canonical_name, type ∈ brokerage_platform,
  infrastructure_vendor, data_provider, investment_firm, regulator, association, partner, client,
  founder_venture, other; segment; countries; pillar_flags; status), `OrganisationRelationship`
  (typed edge: uses, owns, supplies, competes_with, partners_with, parent_of), `Person` (id, name,
  emails[], organisation_id?, kind ∈ staff / consultant / founder / client_contact / cohort).
- `contracts.py`: `Contract` (id, counterparty organisation_id, type ∈ msa / engagement_schedule /
  collaboration_agreement / term_sheet / service_schedule / consultant_agreement /
  founders_service_agreement / other, parent_contract_id?, pillar, status ∈ draft / sent / signed /
  active / expired / terminated, dated_on, effective_on, signed_on?, governing_law, documents[]),
  and `ContractTerm`, a typed row that is one of: `CommissionRate` (engagement_type, yr1_bps,
  yr2_bps, window_months), `CommitmentPayment` (Money, creditable, due_on_signature),
  `RenewalRule`, `RunOffPeriod`, `Milestone` (description, measure, threshold Money?, months?),
  `EquitySplit` (holder, bps, vesting_months, cliff_months), `LongStop` (months), `Restraint`,
  `PaymentTerms` (days, currency).
- `invoices.py`: `Invoice` (id, number, issuer_entity, billed_to organisation_id, contract_id?,
  term_id?, issued_on, due_on, lines[], currency, total Money, tax Money, status ∈ draft / issued /
  sent / part_paid / paid / overdue / written_off / void, external_ref, document), `Payment` (id,
  invoice_id?, received_on, amount Money, fx_rate?, fx_source?, external_ref, matched_by ∈ auto /
  human, matched_at), `CommissionReceivable` (contract_id, term_id, customer_engagement ref,
  cash_received Money, contract_year, computed Money, drawdown_applied Money, status),
  `CostCentre`, `Expense`.
- `approvals.py`: `ApprovalEvent` in the fountainbridge shape (v, seq, scope, id, type ∈
  approval.proposed / granted / rejected, action.executing / executed / failed, at, actor {kind, id},
  data, attestation) so HC-042's log and fountainbridge's are one type.
- Schemas generated, `CHANGELOG` entry, tests for every `extra="forbid"` model round-tripping.

**Here:**

- `schema/` vendored from the package at a pinned version; `scripts/generate-types.mjs` produces
  `lib/contracts/generated.ts`; `make contracts-parity` regenerates and diffs, wired to the
  "Contracts parity" CI job.
- `lib/contracts/index.ts` re-exports. Nothing else in `lib/` defines a shape that exists in the
  package.

## Out of scope

- Tables for these (HC-010, HC-012, HC-014). The SSO claim (HC-035). Anything non-additive.

## Acceptance criteria

- [ ] grassmarket CI is green on the companion PR; its schema-parity step passes; version 0.3.0.
- [ ] `make contracts-parity` here passes, and fails when a schema file is edited by hand.
- [ ] A test constructs a `Contract` with the OpenBB terms from `docs/commercial-record.md` and the
      Reset terms (equity, milestone, long-stop) and validates both with ajv against the schemas.
- [ ] No hand-written TypeScript type in this repo duplicates a package model.

## Verification

`/review` on both PRs. `uv run pytest packages/bcap_contracts` in grassmarket;
`make contracts-parity && npm test` here.
