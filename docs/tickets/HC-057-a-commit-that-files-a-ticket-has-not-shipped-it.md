# HC-057 — A commit that files a ticket has not shipped it

**Status:** Done · **Phase:** 0 · **Depends on:** HC-001 · **Repo:** holy-corner ·
**Branch:** `hc-057-a-commit-that-files-a-ticket-has-not-shipped-it` ·
One ticket = one branch = one PR.

**Set to Done in its own pull request, deliberately.** This ticket is filed and shipped by one
commit, which is exactly the case the fix below does NOT catch. Relying on the check to notice
would leave the board saying Todo for work that shipped, in the pull request about the board
telling the truth. The accepted gap is documented; it is not an excuse to use it.

## Why this matters (for John)

`main` went red on 9 September 2026, immediately after HC-056 merged, and stayed red. The check that
failed is "Tickets match the history", the one whose whole job is to stop the board lying. It was
not lying. The check was.

A board that cries wolf is the thing this check exists to prevent, said in its own source file:
*a check that cites the wrong reason is one a developer learns to skim, and a check people skim is
worse than no check at all.* This is that failure, in our own repository, on the second merge.

## Context

The rule is: **a commit that changed code, whose SUBJECT names the ticket**, is evidence that ticket
shipped. Fountainbridge arrived at it by throwing away two looser rules that produced confident
nonsense, and the reasoning is written out at length in `lib/ticket-drift.ts`.

What broke is a case that reasoning already anticipated but the implementation cannot see:

> "the ticket's own file changed in a commit that also changed code" looked stronger and was worse.
> When one pull request ships one ticket and *files five more* ... every newly-filed ticket is
> created by a code-changing commit, so all five were reported as already shipped. **Filing a ticket
> is not shipping it**, and no file-based signal can tell the two apart.

Fountainbridge's answer was to read the subject only, which works while the subject never names a
ticket the commit merely files. Our squash commit did exactly that:

```
f993fb8  HC-056: file the ticket to take the negotiated terms out of the public repos (#2)
```

That commit **created** `docs/tickets/HC-056-...md` and also changed `tools/ticket-parser/src/parse.ts`.
So it changed code, and its subject names HC-056, and the check reported HC-056 as shipped while its
file correctly said `Todo`.

The claim that "no file-based signal can tell the two apart" is true of the signal fountainbridge
tested, which was "the ticket's file CHANGED". It is not true of a narrower one. **A commit that
ADDS a ticket's file is the commit that filed it.** You cannot file a ticket twice, and a ticket that
is being shipped was filed in some earlier commit, so its file is modified or untouched, never added.

The honest cost of the narrower rule: a ticket filed and shipped in one single commit is missed.
That is a trade the check already makes everywhere else, deliberately preferring a missed report to
a wrong one.

## Scope

- `scripts/ticket-drift.mjs` reads `--name-status` rather than `--name-only`, so it knows which
  paths a commit ADDED as opposed to touched.
- `lib/ticket-drift.ts`: `ticketsShippedBy` takes the added paths and drops any id whose own ticket
  file was added by that same commit. The subject rule is otherwise unchanged, and `isShippingCommit`
  is unchanged.
- Tests for the case that broke `main`, by its real commit subject and real file list, plus: a
  commit that files one ticket and ships another, a commit that ships a ticket whose file it also
  modified (must still count), and a ticket filed and shipped by one commit (documented as missed).
- A line in `CLAUDE.md` non-negotiable 1: a commit subject names the ticket it SHIPS. Filing is
  mentioned in the body. The rule change makes this safe rather than load-bearing, which is the
  right order.

## Out of scope

- Any other change to what counts as evidence. The two looser rules fountainbridge threw away stay
  thrown away.
- Reporting the reverse direction, a ticket marked Done with no commit. Still deliberately not done.

## Acceptance criteria

- [x] `make ticket-drift` passes on `main` at `f993fb8`, the commit that was red.
- [x] A commit that adds `docs/tickets/HC-099-x.md` and changes `lib/x.ts`, subjected
      `HC-099: file it`, is evidence for nothing.
- [x] The same commit, if its subject also names HC-050 and it did not add HC-050's file, is still
      evidence that HC-050 shipped.
- [x] A commit that MODIFIES a ticket's file while shipping it still counts, which is the ordinary
      case and must not regress.
- [x] Mutation check: reverting the change turns three of the new tests red.

## Verification

`/review`. The CI run on `main` green afterwards, linked in the PR.
