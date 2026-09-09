# HC-032 — The fountainbridge connector: ventures, attention, budgets, approvals, open as founder

**Status:** Todo · **Phase:** 2 · **Depends on:** HC-003, HC-005 · **Repo:** holy-corner ·
**Branch:** `hc-032-the-fountainbridge-connector` · One ticket = one branch = one PR.

## Why this matters (for John)

The Foundry Studio already has the one-screen admin ledger (FB-136) and the plan says
"cross-venture aggregation beyond this table is Holy Corner's job". This ticket brings the ventures,
what is waiting on their founders, their engines, their budgets and their approval trail into the
group view, and gives John the same "open as founder" door from here.

## Context

- fountainbridge has no database: ventures are `ventures/*.yaml` (validated against the bcap-contracts
  `Venture` schema), work is `docs/tickets/` in venture repos read via the GitHub API, approvals are
  files on the `foundry-approvals` git ref of the venture repo, and the signed event log is on the
  `foundry-activegraph` ref of the studio repo. Budgets are `ventures/budgets/`. RunReports come
  from the venture box.
- The studio exposes `/api/readiness` (admin only, per-venture wiring) and its pages compute the
  ledger server-side; there is no JSON API for the ledger rows. Two routes: (a) read the same
  sources fountainbridge reads (GitHub API with a read-only token, the two refs, the manifests), or
  (b) add `GET /api/admin/ledger` to fountainbridge returning FB-136's rows as JSON. (b) keeps one
  implementation of the state rules; choose (b), with (a) only for manifests and budgets, which are
  plain files.
- "Open as founder" is `/venture/<id>` on fountainbridge with the admin identity and the strip;
  John's account is admin there already (`STUDIO_ADMIN_EMAILS`).
- `Venture`, `Department`, `Lane`, `Ticket`, `Approval`, `RunReport` types exist in bcap-contracts.

## Scope

- **fountainbridge companion (an FB ticket):** `GET /api/admin/ledger` (admin only) returning
  the FB-136 rows, footnotes and per-venture approval counts as JSON, and `GET /api/admin/approvals`
  (proposed approvals across ventures with their narrated text) — the same read model the pages use.
- `lib/connectors/fountainbridge/client.ts` over those two endpoints with the same cache/timeout
  pattern as HC-031; `manifests.ts` reading `ventures/*.yaml` and `ventures/budgets/` from GitHub
  with a read-only fine-grained token (`FB_GITHUB_TOKEN`, Contents RO on `fountainbridge` only).
- Screens under **The group → Foundry**: the ventures table (FB-136 columns and tones, verbatim),
  each venture's departments and gates, budget envelope vs committed spend (feeds HC-020), the
  approval trail (read-only, narrated), "open as founder".
- The organisation mirror (HC-010): each venture is an organisation of type `founder_venture`
  linked by slug; the founder is a person (HC-011) linked by workspace email.
- The Foundry section of the group ledger (HC-030) fed from these reads.

## Out of scope

- Approving anything here (HC-033 links to the studio's approve action; the gate stays there).
  Reading venture boxes directly. Any write to a venture repo.

## Acceptance criteria

- [ ] The Foundry screen matches fountainbridge's own `/` for the admin, row for row, tone for tone,
      against production (arca amber, modernisation-engine green, the-reset unknown on the day of
      FB-136's reading, or whatever is true on the day; recorded in the PR).
- [ ] The Reset's organisation and Ross's person record link to the venture and the founder.
- [ ] The token used can read `fountainbridge` and returns 404 on `grassmarket` (proved in the PR,
      the FB-072 discipline).
- [ ] A fountainbridge outage renders "could not be read"; screens at both sizes.

## Verification

`/review` on both sides, `/qa` against fountainbridge production as admin.
