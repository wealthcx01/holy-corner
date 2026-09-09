# Workshop bootstrap — the first prompt for the holy-corner lane

Prerequisite (done 2026-09-09): `wealthcx01/holy-corner` exists, private, with the docs and the
ticket set on `main`, and is cloned at `~/projects/holy-corner` on the dev VM.

In a fresh tmux window on the VM (`ssh claudedev`, then `cd ~/projects/holy-corner`), start
Claude Code and paste:

---

Standing order — bootstrap the holy-corner lane.

You are opening a new lane for wealthcx01/holy-corner: Holy Corner, Bruntsfield OS, the internal
executive-management hub over the Advisory Studio (grassmarket), the Foundry Studio (fountainbridge)
and the future client portal (viewforth). The repo holds the full context and no code yet.

Do the following, in order:

1. `git checkout main && git pull --ff-only origin main`. Confirm you see CLAUDE.md,
   docs/holy-corner-plan.md, docs/commercial-record.md, and docs/tickets/HC-001 through HC-053.
   If anything is missing, stop and report it.
2. Read, in full, before writing anything: CLAUDE.md, README.md, docs/holy-corner-plan.md
   (decisions D1–D10 are binding), docs/commercial-record.md, docs/STYLE-VOICE.md, and every
   ticket in docs/tickets/. Then skim docs/source/ for the February 2026 originals; the plan wins
   where they disagree. Record a lane-opening note in gbrain (`holy-corner-lane-opening`): purpose,
   D1–D10, the verticals, the phase-0 dependency order from CLAUDE.md.
3. Read the two sibling repos' CLAUDE.md files on this machine (~/projects/fountainbridge and
   ~/projects/grassmarket) and fountainbridge's docs/tickets/FB-136, FB-092, FB-097, FB-124,
   FB-171, and grassmarket's docs/phase-2-seams.md and docs/tickets/GRS-0132, GRS-0208. These are
   the rules and the seams Holy Corner inherits.
4. Execute HC-001 (docs/tickets/HC-001-scaffold-the-repo.md) on branch hc-001-scaffold-the-repo,
   respecting its scope exactly: the ten named CI jobs, ticket-drift and the ticket parser,
   branch protection with the refusal attached, gstack and gbrain wired for this lane, the
   Railway project reserved, .env.example created. Nothing outside HC-001's scope in this PR.
5. Run /review and /qa before opening the PR. Open the PR with a plain-language summary (what it
   does, what it means, what is left, what John has to decide) and STOP. Do not merge. Report
   lane status.

After HC-001 merges: HC-002 is next, then HC-003 and HC-004 in parallel, then HC-005, HC-006,
HC-007, HC-008 and HC-009. HC-042 (the approval gate) is built right after HC-005 because every
Phase 1 proposal uses it. Ask before deviating from the dependency order in CLAUDE.md.

Rules that bind from the first line: one ticket = one branch = one PR; merge only on green plus
/review; gates never bypassed, no --no-verify; money is integers with a currency; AI proposes and
a person approves; look at every screen at 1440×1000 and 393×851 before saying it works; write
for the reader in plain English, including your last message.

---

## Repo map for the VM

| Repo | Purpose | State |
|---|---|---|
| `wealthcx01/holy-corner` | Bruntsfield OS: the hub, this lane | docs + tickets, HC-001 next |
| `wealthcx01/grassmarket` | the Advisory Studio and `packages/bcap_contracts` | live; HC-005, HC-018, HC-031, HC-035 send companion PRs here |
| `wealthcx01/fountainbridge` | the Foundry Studio, the design tokens, the approval log pattern | live; HC-032, HC-035, HC-053 send companion PRs here |
| `wealthcx01/elite-vault` | the LabCI project the core is adapted from | frozen reference; never changed |
| `wealthcx01/SD3` | Giovanni; SD3-0108 decides the Wise route HC-015 waits on | active |
