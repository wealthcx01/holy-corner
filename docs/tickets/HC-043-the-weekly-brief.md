# HC-043 — The brief: a written weekly read of the group, approved before it is sent

**Status:** Todo · **Phase:** 3 · **Depends on:** HC-030, HC-034, HC-042 · **Repo:** holy-corner ·
**Branch:** `hc-043-the-weekly-brief` · One ticket = one branch = one PR.

## Why this matters (for John)

The Executive Management team will not open a dashboard every Monday. A short written brief — what
came in, what went out, what is overdue, what is waiting on whom, what changed in each studio — that
a person reviewed before it went, is the product for them. Every fact in it has to come from the
record with a link back, and it goes out through the gate like anything else.

## Context

- Sources: the group ledger rows (HC-030), the money strip (HC-014/015/016), what happened
  (HC-034), needs you (HC-033), partner windows (HC-017), the Reset milestone (HC-012).
- ADR-0001: the foreground model drafts; every claim carries the tool result it came from;
  "AI-drafted" until a person accepts.
- HC-019's send path and HC-042's gate; recipients are people with role `exec` or `admin`.
- STYLE-VOICE: define terms, no aphorisms, sentence case, numbers a cold reader cannot misread.

## Scope

- `lib/brief/`: gather (the same reads the screens use, as of a timestamp), draft (a fixed outline:
  money in and out, overdue, waiting on you, per vertical, dated things in the next fortnight; the
  model writes prose per section from the facts, with a citation per sentence), render (HTML email
  in the house style and a page at `/brief/<date>`).
- A schedule (Monday 06:00 Hong Kong time) that drafts and proposes; the proposal card shows the
  full brief; approve sends to the recipients; edit-then-approve allowed.
- The archive at `/brief` with every sent brief and who approved it.

## Out of scope

- Personalised briefs per role (one brief; scoping is by who receives it). Slack or chat delivery.

## Acceptance criteria

- [ ] A drafted brief from fixture data has every number traceable to a tool result shown on hover
      or click; a fact with no source is rendered as "[no source]" and fails the draft.
- [ ] The brief is not sent without a granted event; the sent email's hash matches the approved
      draft.
- [ ] Copy-lint passes on the rendered brief; a reviewer confirms the STYLE-VOICE rules by eye on
      three drafts in the PR.
- [ ] The page at both sizes and the email in two clients (screenshots).

## Verification

`/review` + `/qa`. Three real drafts from production data reviewed by John before merge.
