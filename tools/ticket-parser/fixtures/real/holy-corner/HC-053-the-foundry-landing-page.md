# HC-053 — The Foundry landing page, hosted here

**Status:** Todo · **Phase:** 4 · **Depends on:** HC-052 · **Repo:** holy-corner, plus fountainbridge ·
**Branch:** `hc-053-the-foundry-landing-page` · One ticket = one branch = one PR per repo.

## Why this matters (for John)

Fountainbridge's plan puts the public Foundry surface in Holy Corner at its Phase 5, keeping the
studio private. FB-013 built the Foundry Playbook (Aulet's build arc, Helmer's 7 Powers, Foundry
GTM and operating model, in Bruntsfield's own words) and recommended hosting the landing in the
studio "for now, with a clean path to fold into Holy Corner". This is that fold.

## Context

- fountainbridge `content/playbook/` (markdown, git as source of truth), `/playbook`, `/foundry`,
  `/how-it-works`; the originality rule (no verbatim third-party copy; both frameworks cited).
- HC-050's content loader; HC-052's front door.

## Scope

- fountainbridge companion: the playbook content published as a package or fetched from its repo
  at build time (read-only token), so there is one source.
- Holy Corner: `/foundry` public pages rendering the playbook and the soft introduction with the
  studio sign-in as the primary call to action; house tokens; usable at 393×851.
- fountainbridge's own `/foundry` and `/playbook` redirect here once this is live.

## Out of scope

- New playbook content. Any authenticated surface.

## Acceptance criteria

- [ ] The landing page renders the same chapters as fountainbridge's, from one source, with the
      sign-in CTA landing on the issuer.
- [ ] Originality spot-check recorded in the PR (no verbatim passages from the reference index).
- [ ] At both sizes, heights recorded.

## Verification

`/qa` on production.
