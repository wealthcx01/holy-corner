# HC-009 — copy-lint: plain English as a mechanism, not a hope

**Status:** Todo · **Phase:** 0 · **Depends on:** HC-002 · **Repo:** holy-corner ·
**Branch:** `hc-009-copy-lint` · One ticket = one branch = one PR.

## Why this matters (for John)

CLAUDE.md #12 says write for the reader. Fountainbridge FB-103 specified a lint for the parts of
that rule a machine can check, and never built it; grassmarket GRS-0205 built a copy-register lint
for banned strings. Holy Corner's readers include people who will never read code, and the product
will name money, contracts and other people's studios. Words matter here more than in either studio.

## Context

- `docs/STYLE-VOICE.md` (adopted from grassmarket): em dash rare; no aphorism for an explanation;
  define a term before trading on it; sentence case; numbers a cold reader cannot misread.
- `lib/glossary.ts` (HC-002) holds the vocabulary: "the record", "needs you", "owed to us",
  "the Advisory Studio".
- fountainbridge `scripts/design-lint.mjs` is the shape: zero dependencies, `RULES` exported for
  tests, a `--list` flag, one CI job.

## Scope

- `scripts/copy-lint.mjs` over `app/`, `components/`, `lib/glossary.ts`, `content/` and
  `docs/tickets/`: rules for banned strings (the product names `grassmarket`, `fountainbridge`,
  `ActiveGraph`, `gbrain` in rendered copy; `AR`, `AP`, `MRR` unexpanded; "pending approval";
  "N/A"), title-case headings in JSX, an em dash in a `<p>` or ticket body more than once per
  paragraph, and a numeric range written with a bare hyphen in prose.
- `make copy-lint`, the "Copy contract" CI job made real, a `--list` flag, unit tests per rule
  with one passing and one failing fixture each.
- `docs/copy-contract.md`: the rules in words, with the STYLE-VOICE section each enforces.

## Out of scope

- Grammar, tone, or anything needing a model to judge. Copy in `docs/source/` (historical).

## Acceptance criteria

- [ ] `make copy-lint` passes on the repo and fails on each fixture with the rule name and line.
- [ ] The ticket set in this repo passes (this PR fixes any that do not).
- [ ] The job is required in branch protection.

## Verification

`/review`. `make copy-lint --list` output in the PR.
