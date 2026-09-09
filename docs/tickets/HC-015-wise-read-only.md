# HC-015 — Wise, read-only: receipts matched to invoices, balances, statements

**Status:** Todo · **Phase:** 1 · **Depends on:** HC-014, SD3-0108 (in the SD3 repo) ·
**Repo:** holy-corner · **Branch:** `hc-015-wise-read-only` · One ticket = one branch = one PR.

## Why this matters (for John)

A payment landing in Wise should mark its invoice paid without anyone typing a number. Holy Corner
reads Wise; it never sends. That is the plan's D6 and the payments instance of the external-action
gate. But the *route* into Wise is not decided: SD3-0108 exists because an earlier decision was
built on search snippets and was wrong. This ticket waits for SD3-0108's tested answers and then
builds on whichever route they prove.

## Context

- SD3-0108 (`~/projects/sd3/docs/tickets/SD3-0108-wise-access-research.md`): six questions to be
  answered in Wise's sandbox, not by reading — can a UK personal token call `/v1/profiles/{id}/activities`
  and the balance-statement endpoint; what exactly can the token do (can it create a transfer, and
  how bounded is that); is there an emailed-statement route that needs no credential at all; is the
  personal token deprecating in favour of OAuth 2.0 + mTLS. Its guardrails apply here verbatim:
  no production credential from research; redact account references to last-4 at intake;
  narratives cross the untrusted-content boundary.
- The docs read properly: `docs.wise.com` pages at the `.md` suffix, index at `https://docs.wise.com/llms.txt`.
- Bruntsfield's Wise account is a Hong Kong business account issuing USD invoices; SD3's is the
  personal UK account. The answers may differ by entity type — SD3-0108's tests must be repeated for
  a business profile before this ticket's ADR is written.
- Matching: reference equals invoice number on both real invoices. Match on reference first, then
  amount + counterparty + date window; anything else is "unmatched receipt" for a person.

## Scope

- **Part A (this ticket, after SD3-0108):** `docs/adr/ADR-0003-how-wise-is-read.md` recording the
  proven route for a business profile, the exact endpoints, the token's capability envelope and how
  it is constrained, rotation, and the emailed-statement fallback.
- `lib/wise/client.ts` for the chosen route, read-only by construction (no method that could build
  a transfer exists in the client), credentials in `WISE_*` env vars server-only.
- A background job (Railway cron or an in-process schedule) that reads new activities since the last
  cursor, stores them in `bank_activities` (redacted at intake, raw narrative marked untrusted),
  and runs the matcher: exact reference → proposed match; amount + counterparty + ±7 days → proposed
  match with lower confidence; otherwise unmatched.
- A proposed match is an approval (HC-042 shape) a `finance` or `admin` person accepts; acceptance
  calls `recordPayment` (HC-014). Auto-accept only for exact-reference matches, and then the
  acceptance is still recorded as an event with actor `executor`.
- Screens: **Money → Bank**: balances by currency, recent activity, unmatched receipts with a
  "match to invoice" picker, the proposed-match queue (also surfaces in Needs you, HC-033).
- Statements: monthly CSV/CAMT export pulled and stored for the accountant (HC-020 reads spend from
  the same feed).

## Out of scope

- Any write to Wise, of any kind, ever. SD3's own intake (it shares the client if the route is the
  same, by copy, not by import across repos). FX bookkeeping beyond recording the rate Wise reports
  on a conversion.

## Acceptance criteria

- [ ] ADR-0003 cites a sandbox call actually made for every claim, for a business profile.
- [ ] The client module exports no function capable of creating, funding or cancelling a transfer;
      a test asserts the exported surface.
- [ ] A sandbox receipt with reference `INV-001` marks INV-001 paid with an event carrying the Wise
      activity id; a receipt with no reference lands in unmatched receipts.
- [ ] Account references appear only as last-4 anywhere in the database or the UI.
- [ ] The Bank screen at both sizes, and the Needs-you card for a proposed match.

## Verification

`/review` with security on, `/qa`. The sandbox evidence attached to the PR; no production credential
until John sets it on Railway after merge.
