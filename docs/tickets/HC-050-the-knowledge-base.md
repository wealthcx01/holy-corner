# HC-050 — The knowledge base: playbooks, primers, case studies, served to the Advisory Studio

**Status:** Todo · **Phase:** 4 · **Depends on:** HC-005, HC-031 · **Repo:** holy-corner ·
**Branch:** `hc-050-the-knowledge-base` · One ticket = one branch = one PR.

## Why this matters (for John)

The PRD put the institutional memory here: Briefing archive, anonymised case studies added at
engagement close, playbooks, technical primers, templates, a monthly digest. Since then grassmarket
built the Academy (courses, lessons, section tests, certification) with admin authoring, and
fountainbridge built the Handbook and Playbook from markdown in git. The knowledge base is what
neither holds: content that crosses pillars, written once, served to whichever studio needs it.

## Context

- grassmarket `/workbench/academy` consumes published courses; `/workbench/courses` is the admin
  authoring surface (draft tree, per-lesson approve, publish-to-version). fountainbridge
  `content/handbook/` and `content/playbook/` are markdown chapters rendered by `lib/handbook.ts`.
- PRD §2.5 content types: briefing, case_study, playbook, primer, template, digest.
- Git is the source of truth for prose in both studios; keep that. Holy Corner holds the index and
  the cross-pillar pieces in `content/`, with an API grassmarket can list from.

## Scope

- `content/knowledge/<type>/<slug>.md` with front matter (type, pillars, tags, audience ∈ internal /
  consultants / founders, status); `lib/knowledge.ts` to load and index.
- Screens under **The record → Knowledge**: browse by type and pillar, read, and for admins a
  "publish to the Advisory Studio" action that creates a proposal (HC-042) whose executor calls a
  grassmarket endpoint (companion ticket there) to register the item as an Academy resource link.
- A case-study stub created automatically when a grassmarket engagement closes (read via HC-031),
  as a draft for a person to write.
- `GET /api/knowledge` (scoped by audience) for grassmarket and, later, Viewforth.

## Out of scope

- Authoring courses (grassmarket's). The monthly digest (HC-043 covers the weekly one; a monthly
  knowledge digest is a follow-up).

## Acceptance criteria

- [ ] Five seed items (one per type) render, filter and read at both sizes.
- [ ] Publishing one to grassmarket goes through a granted event and appears in the Academy as a
      link (verified on staging).
- [ ] A closed fixture engagement produces a draft case study naming no client (anonymised by
      construction: the template has no client field).

## Verification

`/review` + `/qa`.
