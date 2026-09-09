# HC-012 — The contracts register: documents, lifecycle, structured terms, and the three real contracts

**Status:** Todo · **Phase:** 1 · **Depends on:** HC-010, HC-011 · **Repo:** holy-corner ·
**Branch:** `hc-012-the-contracts-register` · One ticket = one branch = one PR.

## Why this matters (for John)

Today the three contracts that define Bruntsfield's income are PDFs in three OneDrive folders, and
what they say — 30 % then 20 % for 24 months; a USD 5,000 payment that is creditable for Brandfetch
and not for OpenBB; a spin-out at GBP 5,000 a month for three months — is in John's head. This
ticket makes each contract a record with its documents attached and its terms as typed rows the
revenue engine can compute from. It is the foundation of everything in Phase 1.

## Context

- `docs/commercial-record.md` is the specification: every fact there must be representable and
  seeded.
- `Contract`, `ContractTerm` (typed: CommissionRate, CommitmentPayment, RenewalRule, RunOffPeriod,
  Milestone, EquitySplit, LongStop, Restraint, PaymentTerms) from HC-005. A schedule is a contract
  whose `parent_contract_id` is its MSA; a schedule's terms override the MSA's for what it covers.
- grassmarket `ESTATE-RECONCILIATION.md` §4 records the real lifecycle: proposal (versioned) →
  MSA + Engagement Schedule (versioned to executed) → active engagement. Its `PipelineStage` has a
  `contracted` state with no document. Holy Corner is where the document lives; grassmarket's
  engagement gets an `organisation_link` to it later.
- Elite Vault: `sow_intake` (status, dates, provenance columns, `needs_review`), the Projects page
  with status badges and a cancel flow that truncates downstream schedule rows, uploads to
  `${DATA_DIR}/uploads/sow/` with verbatim filenames (no sanitising, no size limit — fix both).
- Files: a Railway volume or S3-compatible bucket (plan says object storage for documents); never
  in Postgres, never in git. Filenames sanitised, size capped, md5 recorded for dedupe.
- The document versions in OneDrive (`Proposals/OpenBB/OpenBB_BC_MSA_v1..v6.docx`) are the
  contract's history; the register holds only the executed version plus optional prior versions the
  operator chooses to upload.

## Scope

- Migrations: `contracts`, `contract_terms` (one row per typed term, jsonb payload validated against
  the term's schema at write time), `contract_documents` (contract_id, version, kind ∈ executed /
  draft / signed_counterparty / countersigned, storage_key, md5, uploaded_by, uploaded_at),
  `contract_events` (status transitions with actor and note).
- Storage: `lib/storage.ts` over the bucket/volume with signed download URLs; upload route with
  type check (PDF, DOCX), 25 MB cap, sanitised key `contracts/<id>/<version>-<slug>.pdf`.
- Repository: `createContract`, `addTerm`, `replaceTerms` (versioned, never in-place), `attachDocument`,
  `transitionContract` (draft → sent → signed → active → expired | terminated; only forward, each
  audited), `listContracts`, `getContractWithTerms`, `contractsForOrganisation`.
- Screens under **The record → Contracts**: list (counterparty, type, pillar, status, effective,
  next date that matters), the contract page (facts, terms rendered as sentences a reader can check
  against the PDF, documents with download, events, child schedules), create and edit, term editor
  per type, document upload. A "terms as sentences" renderer: `CommissionRate` → "30 % of cash
  received in year 1, 20 % in year 2, for 24 months from first cash".
- The production operator script (HC-008) extended to create all seven contract records with terms
  from the record; the PDFs uploaded by John through the screen.
- The contract types that are not organisations: `counterparty_person_id` for consultant agreements
  and the Founders Service Agreement (HC-011).

## Out of scope

- Reading the PDF to propose terms (HC-013). Generating documents (HC-019). Templates (HC-051).
  Revenue from terms (HC-016). E-signature.

## Acceptance criteria

- [ ] Every fact in `docs/commercial-record.md` for the three contracts is on a record or a term,
      and the terms-as-sentences on each page can be read against the PDF without a gap.
- [ ] The Brandfetch date disagreement (MSA 5 June, schedule "entered into" 8 May) is recorded as
      both dates with a flag note, not collapsed.
- [ ] Uploading `OpenBB_BC_MSA_v6_FINAL_EXECUTED.pdf` twice is refused as a duplicate by md5.
- [ ] A term edit creates a new term version; the old one remains readable with who changed it.
- [ ] `finance` can read every contract; `staff` in `foundry` sees only The Reset's.
- [ ] Contract list and page at both sizes; the OpenBB page's height is recorded and under its
      ceiling with all terms shown.

## Verification

`/review` + `/qa`. The three real contract pages screenshotted from production after John uploads
the PDFs.
