# HC-001 — Scaffold the repo: CI, branch protection, gstack, gbrain, the VM lane, a Railway skeleton

**Status:** Done · **Phase:** 0 · **Depends on:** — · **Repo:** holy-corner ·
**Branch:** `hc-001-scaffold-the-repo` · One ticket = one branch = one PR.

**Shipped in part:** the repository is not registered as a gbrain source, because a running
`gbrain serve` still holds the PGLite single-writer lock. Everything else in this ticket is done.
Branch protection WAS blocked and is now applied; see the amended criterion below.

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
- [x] **A direct push to `main` is refused.** Done on 9 September 2026, after John made the
      repository public, which is what made branch protection available on this account's plan.
      `main` now requires a pull request and all ten checks, with 0 approvals, strict up-to-date,
      linear history, no force pushes, no deletions, and administrators included. The refusal:

      ```
      Changes must be made through a pull request.  (HTTP 422)
      ```

      HC-054 was filed while this was blocked and is superseded. Read "The gate that was not yet a
      gate" below before testing a protection rule the same way.
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

## What `/review` found, and what changed because of it

Two specialist reviewers ran against the diff. Between them they found five things worth the PR,
and three of those were proved by mutation rather than argued.

**The required drift check shipped with no tests at all.** `lib/ticket-drift.ts` exports six
functions and backs the required "Tickets match the history" job. Fountainbridge has 198 lines of
tests for that module at `lib/__tests__/ticket-drift.test.ts`, and the first pass at this ticket
ported the module and left the tests behind. Ported verbatim is not the same as covered. All 29 are
now here, converted from vitest to `node --test` because that is the only runner in this repository
until HC-002. They live inside the parser's package for the same reason, with a note to move them to
the root suite when HC-002 brings vitest.

**The id pattern was fixed twice, because the first fix was too loose.** `[A-Z][A-Z0-9]+` took SD3
and also took `Q1-2026` and `H1-2026`. In an advisory firm's repository a quarter label is ordinary
prose, so "due after Q1-2026" in a `Depends on` value would have become a dependency on a ticket
that does not exist. `[A-Z]{2,}[0-9]*` takes SD3 and refuses both, because it still demands two
letters before any digits. Four mutations now fail: the pattern cannot be tightened back without
losing SD3, and cannot be loosened without picking up quarter labels.

**The parser and the drift check disagreed about what a ticket id is, inside one commit.** The
parser was widened so SD3-0108 stopped vanishing; `lib/ticket-drift.ts` was left on the old pattern,
where `idFromFilename('SD3-0108-x.md')` returned null. The same silent hole, thirty lines away, in
the module whose own header says a check that quietly does nothing is indistinguishable from one
that found nothing. Both now use the same pattern, and a test asserts they agree on the same inputs,
so the two copies cannot drift apart unnoticed.

**Half the split rule was dead code.** The inherited `boldCount >= 4` clause could be deleted with
all 55 tests still green, while deleting the new clause turned two red. Any line carrying two
`**Key:**` fields separated by `·` necessarily has a bold field after a `·`, so the new clause fires
wherever the old one usefully did. Removed rather than pinned with a contrived test, and the comment
that claimed it "still has its own test" was false and is gone.

**Three comments described protections the files did not have.** The UI-gate job said "every step
here is bounded" with no step timeout, and described a version-keyed browser cache that does not
exist. `src/parse.ts` still opened with "2+ uppercase letters" directly above the paragraph
explaining why it is not that any more. A comment claiming a protection is worse than no comment: it
convinces the next reader the work is done. The job now has a bounded step, fountainbridge's
`--with-deps` warning is carried across, the cache is described as HC-006's job in the words of what
is missing, and the stale line is deleted.

Smaller: the drift script's shebang said `node` when the file only runs under bun, and the Makefile
invented a `--check` flag that HC-005 never specifies. Both fixed. The ticket-parser's own
docblocks still introduced it as fountainbridge's package and promised work under FB-006 and FB-007
that will never happen here.


## The gate that was not yet a gate

Worth recording, because this ticket is about making gates real and it is the ticket that got caught
by one.

Branch protection was applied through the API, which returned the full rule with all ten checks. A
direct push to `main` about thirty seconds later **succeeded anyway**. GitHub had accepted the rule
but was not yet enforcing it. The push put this branch's commits on `main` and GitHub then closed
the pull request as merged, which is exactly what the instruction for this ticket said not to do.

Three minutes later the same operation was refused with `Changes must be made through a pull
request`. The rule was correct throughout. Only its enforcement lagged.

Two things to carry forward:

**A rule the API has accepted is not yet a rule that is stopping anything.** If you need to know
that a protection is live, ask it a question rather than pushing at it.

**Test a branch rule with an API ref update, not a git push.** This produces the same proof and
cannot advance the branch, whatever the answer turns out to be:

```
gh api -X PATCH repos/<owner>/<repo>/git/refs/heads/main -f sha=<the current sha>
```

Refused means the gate is live. Accepted is a no-op, because the sha is the one already there. A
`git push` in the same situation either proves the gate or defeats it, and there is no way to know
which until afterwards.

**`git push --dry-run` proves nothing here.** It never contacts the server's pre-receive hooks, so
it reports a clean fast-forward whether the branch is protected or not. It reported success both
before protection was applied and after. An earlier comment on the pull request cited it as
evidence; that comment has been corrected.
