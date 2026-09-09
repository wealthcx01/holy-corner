# HC-034 — What happened, across the group: one activity feed

**Status:** Todo · **Phase:** 2 · **Depends on:** HC-031, HC-032 · **Repo:** holy-corner ·
**Branch:** `hc-034-what-happened-across-the-group` · One ticket = one branch = one PR.

## Why this matters (for John)

"What happened this week" should be one page: a contract signed, an invoice paid, an approval
granted in the Foundry Studio, a deliverable approved in the Advisory Studio, a consultant
promoted. Each studio keeps its own record; Holy Corner reads them and its own activity log and
tells the story in date order, newest first, in sentences.

## Context

- fountainbridge `/activity` (rewritten by FB-080 after it opened with "no CI runs · unprotected ·
  active" over three screens): things that happened, newest first, repository administration
  admin-only. Its `narrate()` in `lib/activegraph.ts` turns events into sentences.
- grassmarket `audit_events` (`GET` via HC-031's admin reads), `certification_events`,
  `prospect_stage_history`, `founder_approvals`.
- Holy Corner's own `activity_log` (HC-004) and approval events (HC-042).

## Scope

- `lib/activity.ts`: one `Happening` shape (at, source, actor, sentence, link, kind), assembled
  from the three sources with per-source narrators, deduplicated where one thing appears twice
  (an approval Holy Corner proposed and a studio granted).
- `/what-happened`: newest first, filters by source, kind, organisation and person, "load older",
  and the day's items grouped under a date heading. Sentences pass copy-lint.
- The organisation and person timelines (HC-010, HC-011) draw from the same assembler.

## Out of scope

- The written weekly brief (HC-043). Anything that is not a recorded event.

## Acceptance criteria

- [ ] Fixture events from all three sources render as one dated list with the right narrator for
      each and no duplicates.
- [ ] Filtering by OpenBB shows only its events across sources.
- [ ] A `staff` principal in `foundry` sees only Foundry and Holy Corner events for their pillar.
- [ ] At both sizes, under the ceiling with 200 items loaded.

## Verification

`/review` + `/qa`.
