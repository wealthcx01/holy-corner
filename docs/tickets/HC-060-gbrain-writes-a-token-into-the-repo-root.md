# HC-060 — gbrain writes a token into the repository root

**Branch:** `hc-060-gbrain-writes-a-token-into-the-repo-root`
**Status:** Done
**Found by:** writing the stopping-point note at the close of 5 October 2026.

## What is wrong

`gbrain put` creates `.gbrain-owner.json` in the working directory. It contains a token:

```json
{"version":1,"token":"<uuid>","brainId":"<uuid>","worktreeId":"<uuid>", ...}
```

Nothing ignored it. **This repository is public**, and every commit in this lane is made with
`git add -A`, so one `gbrain put` followed by one ordinary commit would have published it. That is
CLAUDE.md #9 — *no secrets in the repo, not in code, tickets, fixtures, screenshots, gbrain or
`docs/`* — defeated by a tool that is meant to support the rule.

It had not happened. Checked three ways before fixing anything:

```
git log --all -S'<the token value>'              -> nothing
git log --all --diff-filter=A -- '*.gbrain-owner.json'  -> nothing
```

The file was created minutes earlier by the first `gbrain put` of the session; every gbrain call
before that was a read. So this is a gap closed before it cost anything, not an incident.

## Why it was nearly missed

The file is created as a side effect of a command whose purpose is to write somewhere else. There
is no output line mentioning it, and `git status` only shows it if you look between the `gbrain
put` and the commit. In this session the only reason it surfaced is that the stopping-point check
ran `git status` after the last commit rather than before it.

`gbrain put` also drops a `.md` copy of the page into the root. That one is not a secret — the
brain already holds the original — but it is litter, and it is litter with an arbitrary name, so
it cannot be ignored by pattern without also ignoring legitimate new root-level documents. Delete
it after a `put`.

## What was done

One line in `.gitignore`, with the reason written next to it so nobody removes it as clutter:

```
.gbrain-owner.json
```

## Acceptance criteria

- [x] `git check-ignore .gbrain-owner.json` names the rule.
- [x] The token value appears nowhere in the history of any branch.
- [x] The reason is written next to the rule, not only in this ticket.

## Worth carrying to the other repos

**grassmarket and fountainbridge are both public and both use gbrain.** Neither was checked as
part of this ticket, because this ticket is on this branch. Somebody should run the same two
commands in each before the next `gbrain put` there.
