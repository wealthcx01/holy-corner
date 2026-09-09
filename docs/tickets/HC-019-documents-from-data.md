# HC-019 — Documents from data: an invoice PDF, an MSA and a schedule from templates, Bruntsfield-branded

**Status:** Todo · **Phase:** 1 · **Depends on:** HC-014, HC-042 · **Repo:** holy-corner ·
**Branch:** `hc-019-documents-from-data` · One ticket = one branch = one PR.

## Why this matters (for John)

The next MSA should come out of the record, not out of a `.docx` copied from the last one and edited
by hand through six versions. Elite Vault generated quotes and statements of work from structured
data with a few-shot prompt over its own past documents and a DOCX renderer; the pattern is sound.
Here it renders an invoice from an invoice record (so Holy Corner can issue when Wise is not the
right issuer) and an agreement from a contract record and a template.

## Context

- Elite Vault `lib/docx/quote-template.ts` and `sow-template.ts` (the `docx` library, imperative
  builders, logo with graceful fallback, a Parties section hardcoded to LSEG/Refinitiv), and
  `lib/ai/quote-generator.ts` (few-shot from five random prior documents of the same type).
- grassmarket renders reports with python-docx templates (the SD3 report stack); its consultant
  statement is a `.docx` download.
- The source templates: `Proposals/OpenBB/OpenBB_BC_MSA_v1..v6.docx`, `Brandfetch_BC_MSA_v1..v4`,
  `Bruntsfield_Consultant_Agreement_TEMPLATE_v7.docx`, `Bruntsfield Foundry - Collaboration &
  Incubation Agreement (Template).docx`, and the Proposals folder's `Build-V3-Contracts.ps1` which
  already builds a contract from parts. HC-051 turns these into a proper library; this ticket needs
  only the invoice and one MSA + schedule template to prove the path.
- Sending is an external action: the gate (HC-042) sits between "rendered" and "sent".

## Scope

- `lib/documents/invoice-pdf.ts`: invoice record → PDF in the house style (paper, ink, serif
  headings, the Bruntsfield lockup, registration number, the Wise payment instructions block as
  text supplied from a setting, never from the repo). Stored as an `invoice_document`, downloadable.
- `lib/documents/agreement-docx.ts`: contract record + terms + a template (`content/templates/
  msa-v1.md` with variables, in git) → DOCX, with the terms rendered in the same sentences the
  contract page shows. One template each for MSA and Engagement Schedule, derived from the OpenBB
  v6 shape.
- An AI-assisted first draft for the free-text parts (recitals, scope description), proposed and
  editable, accepted by a person before rendering (ADR-0001 rules).
- "Send" on an invoice or agreement: a proposed external action with the recipient, the document
  hash and the message; on approval, sent by email from a Bruntsfield Workspace mailbox, and the
  event recorded. Until email is configured, "send" produces a download and a marked-as-sent event.

## Out of scope

- The full template library and versioning (HC-051). E-signature. Wise-issued invoices (they stay
  in Wise; this is for invoices Holy Corner issues itself).

## Acceptance criteria

- [ ] INV-003 rendered from a draft invoice record matches Wise's INV-002 layout in content
      (parties, dates, lines, totals, reference) and the house style in look; a side-by-side in the PR.
- [ ] A generated MSA for the demo partner reads correctly against its terms as sentences; a
      changed term regenerates a changed clause.
- [ ] Nothing is sent without an approval event; a test proves a direct call to the sender without a
      granted event is refused.
- [ ] The generated documents carry no LabCI or LSEG text (a test greps the output).

## Verification

`/review` + `/qa`. The rendered PDF and DOCX attached to the PR, looked at.
