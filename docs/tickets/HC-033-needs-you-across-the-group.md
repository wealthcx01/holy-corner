# HC-033 — Needs you, across the group: every waiting decision in one queue

**Status:** Todo · **Phase:** 2 · **Depends on:** HC-031, HC-032, HC-042 · **Repo:** holy-corner ·
**Branch:** `hc-033-needs-you-across-the-group` · One ticket = one branch = one PR.

## Why this matters (for John)

John is the approver in three systems: founder review in the Advisory Studio, the attention queue in
the Foundry Studio, and now proposed matches, extractions, sends and allocations here. Each is a
separate tab with a separate count. One queue, one count, each card saying what it is, what saying
yes does, and where to say it.

## Context

- fountainbridge `/attention`: every open PR and every proposed approval as plain-language cards,
  approve or deny in place, the count in the header computed in the layout inside a `try/catch`.
  The jstack plain-language card: WHAT THIS DOES FOR YOU / THE ONE THING TO APPROVE / IF YOU SAY
  YES / IF YOU SAY NO / who approves.
- grassmarket `GET /founder-review/queue`, `GET /bench/queue`, quiz approvals, invitations (HC-031).
- Holy Corner's own proposals (HC-042): payment matches, extractions, sends, allocations, client-paid
  notifications.
- Rule D9: approvals for a studio's actions are granted in that studio. Holy Corner's queue shows
  the card and deep-links to the studio's approve control; only Holy Corner's own proposals are
  approved here.

## Scope

- `lib/needs-you.ts`: one `Item` shape (source, kind, subject, what it does, what yes does, what no
  does, approver, waiting since, link) assembled from the three sources, sorted oldest first, with
  the source's own age of read shown.
- `/needs-you`: the cards, grouped by source, with approve/refuse in place for Holy Corner's own
  proposals and "open in the Advisory Studio" / "open in the Foundry Studio" for the others; a
  header count that never throws the layout.
- Waiting-time footnote: median days waiting, per source, from proposed-at (Holy Corner records it;
  FB-159 was filed because fountainbridge did not — check whether it has landed and read it if so).

## Out of scope

- Approving a studio's item from here. Notifications (HC-044).

## Acceptance criteria

- [ ] With fixtures from all three sources the queue shows one list, correctly grouped, oldest first,
      each card with the five plain-language fields.
- [ ] Approving a Holy Corner proposal from a card records the granted event with the actor and
      removes the card; refusing records rejected.
- [ ] A studio's card has no approve control here and its link lands on that studio's item.
- [ ] The header count equals the list length for the signed-in role; `finance` sees only money
      items.
- [ ] At both sizes.

## Verification

`/review` + `/qa`. Copy-lint passes on every card string.
