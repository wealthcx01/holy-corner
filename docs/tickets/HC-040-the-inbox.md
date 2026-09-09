# HC-040 — The inbox: paste or drop anything, get a proposal

**Status:** Todo · **Phase:** 3 · **Depends on:** HC-013, HC-042 · **Repo:** holy-corner ·
**Branch:** `hc-040-the-inbox` · One ticket = one branch = one PR.

## Why this matters (for John)

Elite Vault's front door was an inbox: paste an email or drop a file and a six-stage chain reads it,
matches the client, creates the deal, prices it, scores it and prepares the documents, reporting
each stage as it goes. It was the standout feature. Here the same chain reads a partner's cash
statement, a signed schedule, an invoice, a consultant's expense, or a plain email, matches the
organisation, and proposes the records that follow. Every proposal waits for a person.

## Context

- Elite Vault `app/api/inbox/automate/route.ts` (369 lines): stages `extraction → client_match →
  deal_created → pricing_config → win_probability → documents_ready`, each pushing
  `{stage, status, message, data}`; accepts JSON or FormData with PDF/TXT/EML/MSG/HTML/DOCX;
  `inbox-extractor.ts` passes up to 100 known brand names for matching; attachments parsed in memory
  and never persisted. Hardcoded `ENTITY_DEFAULTS` for LabCI entities — replace with the
  organisation register.
- Stages here: **read** (what kind of document is this; ADR-0001's client) → **match** (organisation,
  contract, invoice, deal, by name and reference against the register) → **propose** (typed
  proposals: a contract with terms, an invoice, a payment, a cash report, an expense, a note) →
  **check** (the engines dry-run the proposal and say what would change: a ledger row, a margin) →
  **wait** (the approval, HC-042).
- The document itself is stored (HC-012's storage) with the proposal, unlike Elite Vault.
- Emails: paste for now; a Bruntsfield Workspace mailbox forwarding to an intake address is a
  follow-up once the shape settles.

## Scope

- `/inbox`: paste box, drop zone, the stage-by-stage report as it runs (server-sent events), the
  proposals as cards with what would change, accept / edit / refuse per proposal.
- `lib/inbox/pipeline.ts` with the five stages as pure steps over the AI client and the repository;
  every stage result stored on an `inbox_items` row with its provenance.
- Matching uses the register (HC-010) and open references (invoice numbers, deal names); ambiguity
  is a question on the card, never a guess.
- Proposal kinds wired: contract terms (HC-013's reader), invoice registration (HC-014), payment
  by hand (HC-014), partner cash report (HC-017), expense allocation (HC-020), note on an
  organisation (HC-010).

## Out of scope

- Autonomous acceptance of anything. A mailbox integration. Reading Slack or calendars.

## Acceptance criteria

- [ ] Dropping the Brandfetch schedule PDF proposes the contract and its terms (HC-013) and matches
      Brandfetch SA from the register; accepting writes through the same paths as manual entry.
- [ ] Pasting an email "we received USD 120k from <customer> on 4 Oct under the white-label deal"
      proposes a cash report on the OpenBB contract with the commission it would generate, and asks
      which Notified Prospect if two match.
- [ ] Every stage's message passes copy-lint; a failed stage says why and stops.
- [ ] Nothing reaches the record without a granted approval event naming the person.
- [ ] At both sizes.

## Verification

`/review` with security on (file handling), `/qa`.
