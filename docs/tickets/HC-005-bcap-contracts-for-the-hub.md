# HC-005 — bcap-contracts for the hub: new types, vendored schemas, generated TypeScript, a parity check

**Status:** Done · **Phase:** 0 · **Depends on:** HC-004 · **Repo:** holy-corner, plus grassmarket
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

- [x] grassmarket: version 0.3.0, schema parity passes, **1,948 tests passed and 1 skipped** with
      nothing existing broken. ruff, ruff format and pyright all clean on the new code.
- [x] `make contracts-parity` passes, and fails when a generated file is edited by hand — proved by
      appending a line, watching it name the file, and regenerating.
- [x] A test constructs an advisory `Contract` (two commission structures, a commitment payment,
      payment terms) and a Foundry one (milestone, equity split, long-stop) and validates both with
      ajv against the vendored schemas. **The figures are deliberately fictional** — see below.
- [x] No hand-written TypeScript type duplicates a package model, **enforced by a test** that walks
      `lib/`, `app/` and `components/` and fails on any declaration of a contract's name outside
      `lib/contracts/`. It found one on its first run.

## Verification

`/review` on both PRs. `uv run pytest packages/bcap_contracts` in grassmarket;
`make contracts-parity && npm test` here.


## What building it turned up

**`Money` could not carry an invoice, and finding out why was the most useful hour of this ticket.**
The package's `Money` cannot be constructed without an `assumption_register_ref`, and its own
docstring says a `Money` without one "is not constructible". That is correct for what it is for: a
lever NPV is only meaningful under stated assumptions, and grassmarket's ADR-0002 exists because the
prototype subtracted pounds from score-points.

An invoice is the other kind. USD 5,000 owed is not modelled, not uncertain, and not an assumption.
It is written on a document somebody signed. Putting it in a field named `assumption_register_ref`
would say the opposite of what is true, and a field used against its own name is how a wrong number
survives review: the next reader believes the name.

So `RecordedAmount` sits beside `Money` and is distinguished by WHERE THE NUMBER CAME FROM, which is
what actually differs. `Money` cites the assumptions behind a modelled figure; `RecordedAmount` cites
the source an observed one was read from. Both are integer minor units with a currency, neither can
exist without provenance, and nothing converts one to the other.

**This repo already had a third type called `Money`, and the new test caught it.** HC-004's
`lib/money.ts` declared `Money` for arithmetic, and the package declares `Money` for a modelled
figure. Two types with one name meaning different things is exactly the drift CLAUDE.md #6 names by
filename, arrived at here within one ticket of writing the rule down.

The local one is now `Amount`, and the distinction is real rather than cosmetic: arithmetic needs a
type that carries NO provenance, because the subtotal half way through summing an invoice has no
source document and no assumption register. Forcing it to carry one would mean inventing a source,
and an invented provenance is worse than none because it looks like an answer. `toRecordedAmount`
and `fromRecordedAmount` cross the boundary, and the caller supplies the source at the point they
actually know it.

**Generating the TypeScript took three attempts, and the first two are worth recording.** Compiling
all twenty-four schemas nested under one `$defs` broke every schema's own internal `$ref`: a pointer
like `#/$defs/ActorKind` stops resolving the moment its file is not the document root. Compiling
them separately and concatenating produced duplicate identifiers, because `Kind`, `Months`,
`Provisional` and `RestraintType` each exist in several contracts and `kind` is a different literal
type in every term. One module per contract has neither problem. `lib/contracts/index.ts` re-exports
the twenty-four by name, which is the only surface anything imports from.

**Ten existing schemas are in the grassmarket diff.** `Currency` gained `CHF` and `HKD`, and it is
embedded in several contracts, so each of those regenerated with exactly two new enum members and
nothing else.

## Why the test figures are invented

HC-005 asks for a test built from the real commercial record. **The figures in both repositories'
tests are deliberately fictional and the structures are real.**

Both repositories are public. HC-056 exists to get Bruntsfield's negotiated commission rates,
commitment amounts and equity terms OUT of public repositories, because both advisory agreements
carry a Most-Favoured-Nation clause. Copying them into a test would add two more places to scrub and
work directly against that ticket, for nothing: what needs proving is that the shapes carry the real
record, and a shape is proved by its structure rather than by its values.

The assertion that the actual terms are representable belongs with the actual terms, which after
HC-056 is not a public repository. HC-008's operator script is where they are typed, once, by a
person.
