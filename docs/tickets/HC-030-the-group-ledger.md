# HC-030 — The group ledger: every vertical on one screen, coloured by whose attention it needs

**Status:** Todo · **Phase:** 2 · **Depends on:** HC-008, HC-016 · **Repo:** holy-corner ·
**Branch:** `hc-030-the-group-ledger` · One ticket = one branch = one PR.

## Why this matters (for John)

This is the screen the project exists for. Fountainbridge's FB-136 did it for one vertical: a row
per venture, amber when its founder is the bottleneck, red when its engine is, unknown when the
read failed, idle when nothing is happening, red beats amber. Holy Corner does it for the group: a
row per vertical, then per thing inside it that matters this week, with the money beside it. One
glance, and the thing needing attention is coloured by whose attention it needs.

## Context

- FB-136 (`the admin ledger`): columns Venture · Founder · Needs them · Underway · Engine · Spend ·
  action; the four states and their precedence; "Open as founder" as a real deep link with a strip;
  footnotes derived from real data or saying they have none; the `.sr-only` inside a scroll
  container defect; the vacuous guard lesson. Read the ticket before designing.
- Data comes from HC-031 (grassmarket), HC-032 (fountainbridge), HC-014/015/016 (money), HC-033
  (needs you). This ticket ships with each connector's fixture until the connector lands, and the
  row says "could not be read" honestly when it cannot.
- fountainbridge's status tones (`lib/status.ts`) are the palette; nothing else.
- There is no design artefact yet. This ticket produces one: a Claude Design canvas of the ledger at
  both sizes, agreed with John before the screen is built, and recorded in
  `docs/design-conformance.md` as the design to compare against.

## Scope

- The design: a canvas with the group ledger at 1440 and 393, the row anatomy, the four states,
  the footnotes, the money strip. Agreed in the PR before code.
- `/` for `admin` and `exec`: the money strip (owed to us by currency, overdue, cash by currency
  from Wise, expenses awaiting allocation) then one section per vertical:
  **Advisory** — consultants active, pipeline by stage, engagements in delivery, drafts awaiting
  founder review, earnings pending; **Foundry** — the FB-136 rows themselves (venture, founder,
  needs them, underway, engine, spend); **Clients** — "not started"; each with its tone and its
  deep link ("open the Advisory Studio as John", "open as founder").
- `lib/ledger.ts`: a pure `rowState(facts) → tone` with the precedence rules, unit-tested for every
  combination including "read failed" ≠ "engine unknown".
- Reads parallelised with a per-source timeout; a source that fails renders "could not be read"
  and the row is `unknown`, never green.
- Footnotes: things waiting on John and for how long (median), sources last read at, and the next
  dated thing (an invoice due, a window closing, a milestone review).
- `finance` lands on **Money**; `staff` on their pillar; only `admin` and `exec` see the ledger
  (asserted by a test, as FB-136 did).

## Out of scope

- Acting on anything from the ledger. Every action happens in the studio it belongs to, through
  that studio's gates. Cross-vertical analytics (thesis validation, entity frequency): the data model
  captures the inputs; the charts wait for ten engagements.

## Acceptance criteria

- [ ] The design canvas exists, is linked from `docs/design-conformance.md`, and John has agreed it.
- [ ] Rendered beside the design at both sizes with heights within 10 % of the design's.
- [ ] With grassmarket unreachable the Advisory section says so and is `unknown`; with fountainbridge
      reporting a stopped engine and six waiting decisions the Foundry row is red, not amber.
- [ ] Time to first byte under 500 ms on production with real sources (fountainbridge FB-151's
      lesson: measure the shell before the rows).
- [ ] A `finance` principal never sees the ledger (test).

## Verification

`/plan-ceo-review` on the design, `/review` + `/qa` on the build, the side-by-side in the PR.
