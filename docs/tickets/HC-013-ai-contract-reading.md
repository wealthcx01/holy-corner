# HC-013 — AI contract reading: a PDF becomes proposed terms, validated, accepted by a person

**Status:** Todo · **Phase:** 1 · **Depends on:** HC-012 · **Repo:** holy-corner ·
**Branch:** `hc-013-ai-contract-reading` · One ticket = one branch = one PR.

## Why this matters (for John)

The fourth contract should not be typed in. Elite Vault read 190 statements of work and 546 quotes
out of PDFs into structured rows; that pipeline is the most reusable thing in it. Here it reads a
contract into the typed terms HC-012 defined, shows them beside the source text, and waits for a
person to accept. Nothing the model read becomes a term until then. This is also the first live
model call in the estate, so it sets the precedent: it gets an ADR.

## Context

- Elite Vault `lib/parsers/pdf-extractor.ts` (pdf-parse, 60k-char cap, md5), `lib/ai/sow-parser.ts`
  (build prompt → invoke → brace-slice JSON → stamp `model`, `llm_request_id`, token usage,
  `parsed_at`, `parser_version`, `needs_review`), `prompts.ts` (system prompt + `buildSOWPrompt`).
  Reusable shape; LabCI content, a Bedrock/Nova client, no output validation, no retry. Replace the
  client with the Anthropic SDK, validate with the term schemas, add retry with backoff.
- grassmarket's pattern for AI output: the proposed document lives on the extraction record, never
  on the assessment, until confirmed; confirmation replays through the ordinary write path so
  confirmed data is indistinguishable from manual entry; per-field provenance rows. Copy this.
- Plan D3: `claude-sonnet-5` foreground; key server-side only; env var names set here for the estate.
- `docs/adr/README.md` reserves ADR-0001 for this.

## Scope

- `docs/adr/ADR-0001-how-holy-corner-calls-claude.md`: the SDK, model IDs and where they are
  configured (`HC_MODEL_FOREGROUND`, `HC_MODEL_BACKGROUND`), `ANTHROPIC_API_KEY` server-only, every
  call records model, request id, tokens, prompt version and a content hash of the input; every
  output is a proposal with `needs_review`; retries and timeouts; no tool that executes an external
  action.
- `lib/ai/client.ts` (the only file that imports the SDK), `lib/ai/prompts/contract-terms.ts`
  (versioned), `lib/ai/contract-reader.ts`: PDF text → proposed `Contract` fields + `ContractTerm[]`
  + per-field `{ quote, page, confidence }` provenance, validated against the schemas; anything that
  does not validate is a `needs_review` field, not a dropped one.
- Migration: `contract_extractions` (contract_document_id, status ∈ proposed / accepted / rejected,
  proposed jsonb, provenance jsonb, model fields, reviewed_by, reviewed_at), `field_provenance`.
- Screen: on a contract document, "Read this document" → a side-by-side of proposed terms and the
  quoted source text, accept-all, accept-per-term, edit-then-accept, reject. Acceptance writes terms
  through HC-012's `replaceTerms` and records the approval event (HC-042's shape; until HC-042
  lands, the same table it will use).
- Golden fixtures: the three real contracts' extracted text is **not** committed; instead a test
  runs against the PDFs from a local path in `HC_CONTRACT_FIXTURE_DIR` when present, and CI runs
  a redacted synthetic contract with the same structure. Expected terms for the real three live in
  the operator script and the test compares.

## Out of scope

- Reading emails or arbitrary documents (HC-040). Reading invoices (HC-014 seeds by hand; HC-040
  reads them). Any write to a term without a person's acceptance.

## Acceptance criteria

- [ ] ADR-0001 accepted and linked from CLAUDE.md.
- [ ] On the OpenBB schedule, the reader proposes the 30/20/24 rate, the 25 % pilot rate, the
      USD 5,000 non-creditable commitment, the renewal rule and the run-off period, each with a
      quote from the page it came from; on the Brandfetch schedule it proposes the creditable
      drawdown; on the Reset term sheet it proposes the milestone, the 50/40/10 split, 48/12 vesting
      and the 24-month long-stop, and flags the bracketed figures as `needs_review`.
- [ ] A proposed term that fails schema validation is shown as needing review, never silently dropped.
- [ ] Nothing is written to `contract_terms` until accept; the approval event carries the reviewer.
- [ ] The key is absent from every client bundle (a test greps the build output).
- [ ] The extraction screen at both sizes.

## Verification

`/review` with security on, `/qa`. The three real extractions run by John from production, with
the side-by-side screenshots in the PR.
