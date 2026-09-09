# HC-001 — Scaffold the repo: CI, branch protection, gstack, gbrain, the VM lane, a Railway skeleton

**Status:** Todo · **Phase:** 0 · **Depends on:** — · **Repo:** holy-corner ·
**Branch:** `hc-001-scaffold-the-repo` · One ticket = one branch = one PR.

## Why this matters (for John)

Every other ticket assumes the repo behaves like grassmarket and fountainbridge: a PR cannot merge
on red, a ticket cannot drift from what shipped, the lane on the VM has memory, and the checks have
names that never change. Fountainbridge learned each of these the hard way (FB-124's unusable-but-green
screens, FB-097's four tickets all called `ARCA-NEW`, the eighteen tickets ticket-drift found on
its first run). This ticket makes the same mistakes impossible here before there is any code to make
them in.

## Context

- The repo exists (`wealthcx01/holy-corner`, private) with `CLAUDE.md`, `README.md`, the plan, the
  commercial record, the converted PRD, and this ticket set. No app yet.
- fountainbridge `.github/workflows/ci.yml` is the CI template: ten jobs with stable names, each
  no-op until its subject exists (`if [ -f package.json ]`). Copy it, rename nothing later.
- gstack is installed globally on the VM and on John's machine; gbrain runs as PGLite at `~/.gbrain`
  on both, registered per repo by `/setup-gbrain` and `/sync-gbrain`. On the VM `gbrain sources list`
  timed out on 9 Sep 2026: a running MCP `gbrain serve` holds the single-writer lock; stop it first.
  The VM has gbrain 0.42.58.0 and John's machine 0.46.21.0; 0.48.5.0 is current. Upgrade both first.
- The VM lane pattern is `~/projects/<repo>` cloned from GitHub, a tmux window, and a bootstrap
  prompt (fountainbridge `docs/bootstrap-prompt.md`). Ours is `docs/bootstrap-prompt.md`.

## Scope

- `.github/workflows/ci.yml` with these job names, exactly, all trivially green until their ticket:
  **Lint · Typecheck · Test · Build · Playwright UI gate · Design contract · Copy contract ·
  Tickets match the history · Contracts parity · Parse tickets**.
- `scripts/ticket-drift.mjs` + `lib/ticket-drift.ts` ported from fountainbridge (bun, `fetch-depth: 0`),
  reading `**Status:**` lines against `origin/main`. Wired to "Tickets match the history".
- `tools/ticket-parser/` ported from fountainbridge (zero-dependency, never throws, warns on
  `no-id` and `unrecognized-status`) with an `HC-` fixture set; wired to "Parse tickets".
- `Makefile` with `parse-tickets`, `ticket-drift`, `design-lint`, `copy-lint`, `contracts-parity`
  targets (the last three no-op until HC-002 / HC-009 / HC-005).
- Branch protection on `main`: PR required, all ten checks required, 0 approvals, no force-push,
  applied with `gh api`. Attach the refusal from a direct push attempt to the PR.
- gstack: run `/setup-gbrain` for this repo on the VM and locally; `/sync-gbrain` writes the search
  guidance block into `CLAUDE.md` (leave the block where it lands). Record the lane-opening note
  `holy-corner-lane-opening` in gbrain: purpose, D1–D10, the verticals, the dependency order.
- VM: `git clone` into `~/projects/holy-corner`, confirm `claude` opens there, add the row to
  `~/RESUME.md`'s repo map. `docs/bootstrap-prompt.md` holds the first prompt for the lane.
- Railway: create the `holy-corner` project and an empty service with `railway.json`
  (NIXPACKS, `npm run start`, `healthcheckPath: /api/health`, `ON_FAILURE`, 3 retries). No deploy
  until HC-007; this only reserves the name and the Postgres add-on.
- `.env.example` created, empty but for a header, so every later ticket has a file to add to.

## Out of scope

- The app (HC-002), auth (HC-003), the database (HC-004), any screen.
- Publishing the repo. It stays private: it will hold contract terms and invoice states.

## Acceptance criteria

- [ ] CI runs on a PR with all ten named jobs green.
- [ ] A direct push to `main` is refused; the refusal text is in the PR.
- [ ] `make ticket-drift` passes on this ticket set and fails on a fixture ticket marked Done with
      no commit mentioning it.
- [ ] `make parse-tickets` parses every `HC-*.md` with zero warnings.
- [ ] `gbrain search "holy corner lane opening"` returns the note on the VM.
- [ ] `~/projects/holy-corner` exists on the VM at `origin/main`.
- [ ] The Railway project exists with a Postgres add-on and no running deploy.

## Verification

`/review` + `/qa`. Screenshot of the branch-protection settings page and of the green CI run in the PR.
