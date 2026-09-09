# HC-045 — Memory: gbrain for the lane, and for the record

**Status:** Todo · **Phase:** 3 · **Depends on:** HC-001, HC-041 · **Repo:** holy-corner ·
**Branch:** `hc-045-memory` · One ticket = one branch = one PR.

## Why this matters (for John)

Two memories matter. The lane's: what was decided and why, across sessions, so the next session
does not re-derive it. The record's: what is known about OpenBB, or Ross, or the Brandfetch
drawdown, in a form the composer can recall when asked. gbrain is the tool for both and is already
running on the VM and John's machine; the studios use it for the first and fountainbridge's venture
brain for the second.

## Context

- `/setup-gbrain` and `/sync-gbrain` (HC-001); the search-guidance block in CLAUDE.md; gbrain's
  autopilot; the single-writer PGLite constraint that made fountainbridge put a token-guarded
  bridge in front of it (`deploy/lane/brain-bridge.mjs`).
- SD3-0109: the gbrain **CLI** rejects `--entity` on `remember` / `recall` (0.48.5.0) while the
  **MCP** interface has an `entity` parameter — read `gbrain remember --help` on the box before
  writing a line; do not guess the flag.
- fountainbridge FB-043's deposit bridge: durable facts written to git `context/`, secret-scanned,
  human-merged; and FB-050's brain search behind a token.
- The composer (HC-041) is the consumer of record memory; the background model summarises.

## Scope

- Lane memory: `/sync-gbrain` on a schedule on the VM for this repo; decisions from every merged
  PR's "What building it turned up" section deposited as notes with the ticket id; a
  `docs/decisions-log.md` regenerated from gbrain so the record is also in git.
- Record memory: a `hc-record` gbrain source fed by a job that writes one page per organisation,
  contract and person from the repository (facts only, no bank details, no narratives from
  untrusted content), refreshed on change; entity scoping done the way the CLI on the box actually
  supports (recorded in the PR).
- The composer's `recall` tool over `hc-record`, scoped by the caller's principal at the page level.
- Secret scan on everything written to gbrain (grassmarket `scripts/secret_scan.py` ported).

## Out of scope

- Storing conversation transcripts. Sharing memory with a studio's brain.

## Acceptance criteria

- [ ] `gbrain search "brandfetch drawdown"` on the VM returns the contract page with the creditable
      commitment term.
- [ ] A page containing a fixture account number is refused by the scan and never written.
- [ ] The composer's answer to "what do we know about Ross" cites the record page and only facts
      the caller may see.
- [ ] `gbrain remember --help` output from the box is in the PR and the code matches it.

## Verification

`/review` + `/qa`. `/sync-gbrain` run and its report attached.
