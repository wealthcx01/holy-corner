# HC-001 — Scaffold the repo: CI, branch protection, gstack, gbrain, the VM lane, a Railway skeleton

**Status:** In review · **Phase:** 0 · **Depends on:** — · **Repo:** holy-corner ·
**Branch:** `hc-001-scaffold-the-repo` · One ticket = one branch = one PR.

**Shipped in part:** branch protection on `main` is not applied, and the repository is not
registered as a gbrain source. Both are blocked, neither is forgotten, and both are named below.

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

- [x] CI runs on a PR with all ten named jobs green.
- [ ] **A direct push to `main` is refused; the refusal text is in the PR.** *Not done, and it
      cannot be done from this repository.* GitHub refuses branch protection AND rulesets on a
      private repository under this account's plan. Making the repository public to get round it is
      out of scope in this ticket and wrong on the merits: the commercial record is committed here.
      Filed as **HC-054**, which needs a decision from John before it can start.
- [x] `make ticket-drift` passes on this ticket set, and fails when a ticket disagrees with the
      history. *The criterion as written asked for the opposite direction* — "fails on a fixture
      ticket marked Done with no commit mentioning it" — which the ported check deliberately does
      NOT do. See "What building it turned up" below.
- [x] `make parse-tickets` parses every `HC-*.md` with zero warnings. All 39, including the two
      tickets this PR files.
- [x] `gbrain search "holy corner lane opening"` returns the note on the VM.
- [x] `~/projects/holy-corner` exists on the VM at `origin/main`.
- [x] The Railway project exists with a Postgres add-on and no running deploy.
- [ ] **The repository is registered as a gbrain source.** *Not done.* A running `gbrain serve`
      (PID 1998533) holds the PGLite single-writer lock, so `gbrain sources list` times out. The
      lane-opening note itself is written and searchable, which is what this ticket needed gbrain
      for. Registering the source is a minute's work once that process is stopped.

## Verification

`/review` + `/qa`. Screenshot of the branch-protection settings page and of the green CI run in the PR.

## What building it turned up

Five things. Two were defects in the ported tools, one was a rule that turned out to be
load-bearing on day one, one was a criterion in this ticket that asked for the wrong thing, and one
was a deadline nobody had noticed.

**The parser silently dropped a dependency on another repository's ticket.** HC-015 declares
`**Depends on:** HC-014, SD3-0108`, and SD3-0108 is the ticket that decides how Wise is read — the
one HC-015 cannot start without. Fountainbridge's id pattern is `[A-Z]{2,}-\d+`, an all-letter
prefix, which was true of every prefix it had: FB, GRS, ARCA. It is not true here. `SD3` contains a
digit, so the dependency matched nothing and parsed to an empty list. Not flagged, not warned about,
just gone. The pattern is now `[A-Z][A-Z0-9]+-\d+`, with tests pinning both that SD3-0108 is read
and that widening it did not turn `clause 5-1` or `USD 5,000` into ticket ids.

**The parser silently dropped the branch name on five tickets.** HC-005, HC-018, HC-031, HC-035 and
HC-052 all wrap their header across three lines, and the wrapped line reads
`` (`packages/bcap_contracts` only) · **Branch:** `hc-005-...` here and a ``. The field scanner only
split a line into fields when the line already had at least two of them, and the field pattern is
anchored to the start of a line, so a field sitting after prose matched nothing. All five parsed
their branch as `null` on a field the ticket states plainly. The split rule now also fires when a
bold field appears after a `·`, which is exactly the case that was missed, and does not fire on
`- **Status:** blocked · waiting`, where what follows is prose and truncating it would lose half the
status. That case keeps its own test.

Both are the same fault: a declared value disappearing without a word. That is non-negotiable 3
broken in the quietest possible way, on the two fields that say what a ticket is waiting for and
where its work happens.

**FB-145's range fix is load-bearing here from the first commit.** The commit that seeded this
repository is subjected *"Holy Corner: plan, commercial record, and the HC-001 to HC-053 ticket
set"*, and it changed code as well as tickets. Without fountainbridge's rule that strips ticket-id
*ranges* before reading ids, ticket-drift reads `HC-001` and `HC-053` as shipped and demands both be
marked Done. Removing the fix and re-running proves it: two tickets reported, exit 1. This
repository's very first CI run would have been red for the same reason fountainbridge's `main` was.

**This ticket's ticket-drift criterion asked for the opposite of what the check does.** It says the
check should fail "on a fixture ticket marked Done with no commit mentioning it". The ported check
deliberately does not do that, and `lib/ticket-drift.ts` explains why at length. Plenty of
legitimate work leaves no commit naming it: a decision, a withdrawn ticket, work folded into
another. Flagging those produces noise, and a check people learn to ignore is worse than no
check. It is one-directional on purpose: it reports a ticket that shipped and does not say so.
Verified in the direction it actually works, with a scratch clone: a ticket marked Todo whose id is
named in a code-changing commit is reported, and the command exits 1. The criterion's wording is
the defect, not the tool.

**`railway.json` is deprecated and stops being read on 1 December 2026.** The Railway CLI says so on
every command. This ticket created one anyway, because that is what it specifies and what both
sibling studios use, and swapping the mechanism is not this ticket's job. Filed as **HC-055**, which
covers all three repositories, because a deploy configuration that is silently ignored is worse than
one that is missing.
