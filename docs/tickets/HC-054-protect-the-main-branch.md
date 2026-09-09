# HC-054 — Protect the main branch

**Status:** Todo · **Phase:** 0 · **Depends on:** HC-001 · **Repo:** holy-corner ·
**Branch:** `hc-054-protect-the-main-branch` · One ticket = one branch = one PR.

## Why this matters (for John)

HC-001 built the ten CI checks. It could not switch on the thing that makes them matter: the rule
that stops a pull request merging while any of them is red, and stops anyone pushing straight to
`main` and skipping them altogether. Until that rule exists, every gate in this repository is a
suggestion. A person in a hurry, or an agent following a plausible instruction, can put anything on
`main` and nothing will stop it.

## Context

GitHub refused, twice, on 2026-09-09:

```
gh api repos/wealthcx01/holy-corner/branches/main/protection
  -> 403 Upgrade to GitHub Pro or make this repository public
gh api repos/wealthcx01/holy-corner/rulesets
  -> 403 Upgrade to GitHub Pro or make this repository public
```

`wealthcx01` is a personal account on the free plan. On that plan, branch protection and repository
rulesets both work on public repositories only.

This has never come up before because **fountainbridge and grassmarket are public repositories.**
That is the only reason fountainbridge has protection on `main` at all. Holy Corner, elite-vault and
SD3 are private, and none of the three is protected. Grassmarket's `main` is not protected either,
despite what its own CLAUDE.md implies.

Making this repository public is not the way out. HC-001 puts it out of scope in as many words, and
`docs/commercial-record.md` is the reason: OpenBB's and Brandfetch's negotiated commission rates,
both under Most-Favoured-Nation clauses, Ross Cochrane's equity split and vesting, and Bruntsfield's
registration details are all committed here, and named across nineteen files. Publishing them would
expose two counterparties' and one named individual's confidential terms, and a public repository is
cloned and indexed long before anyone can take it back.

## Scope

- Buy GitHub Pro for `wealthcx01`, or move the repository into an organisation on a plan that
  includes protected branches for private repositories.
- Apply the rule to `main` with `gh api`: a pull request is required, all ten checks are required,
  0 approving reviews, no force-push, no deletion, and administrators included.
- The ten required checks, one per line so each can be copied exactly as
  `.github/workflows/ci.yml` names them. A name retyped slightly wrong is a check that silently
  stops being required:

  ```
  Lint
  Typecheck
  Test
  Build
  Playwright UI gate
  Design contract
  Copy contract
  Tickets match the history
  Contracts parity
  Parse tickets
  ```
- Attempt a direct push to `main`, and put the refusal text in the pull request.
- Check whether grassmarket's `main` should be protected too, and file a GRS ticket if so. It is
  public, so nothing but the decision is in the way.

## Out of scope

- Making this repository public, in any form, for any reason.
- Requiring an approving review. 0 approvals is deliberate and unchanged: CI plus `/review` is the
  quality gate, and a single-account approval requirement blocks every merge for no benefit
  (fountainbridge amended exactly this on 2026-07-28).

## Acceptance criteria

- [ ] A pull request with a red check cannot be merged, shown by a screenshot.
- [ ] A direct push to `main` is refused, with the refusal text in the pull request.
- [ ] All ten checks appear in the required list, spelled exactly as CI names them.
- [ ] The repository is still private.

## Verification

`/review`. Screenshots of the settings page and of a blocked merge.
