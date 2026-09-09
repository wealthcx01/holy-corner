# CLAUDE.md — Holy Corner (Bruntsfield OS)

Holy Corner is **Bruntsfield Capital's operating system**: the internal, admin-only hub where the
Executive Management team sees the whole group in one place — every vertical, every contract, every
invoice, every pound and dollar owed or due, every decision waiting on a person. It is named after
the Edinburgh junction where four roads meet, because that is what it is: the place the verticals
converge. Planned home: `os.bruntsfieldcapital.com`.

The verticals it looks across:

| Vertical | Studio | Codename | State (Sept 2026) |
|---|---|---|---|
| Advisory | Advisory Studio | **grassmarket** | live, 260+ tickets |
| Foundry | Foundry Studio | **fountainbridge** | live, 210+ tickets |
| Clients | Client portal | **viewforth** | not started |
| Briefing / Equity / Cohort | The Meadows / Marchmont / Morningside | — | names only |

Both live studios explicitly defer the cross-vertical management view to this project (grassmarket
GRS-0132, GRS-0208; fountainbridge FB-136, phased plan §1). **That is the mandate.** Holy Corner is
never exposed to consultants, founders or clients; they have their own studios.

The core is adapted from **Elite Vault**, the revenue-intelligence platform we built for LabCI
(contracts → revenue schedule → ledger → reconciliation, AI extraction and document generation). A
read-only reference copy sits at `elite-vault/` (gitignored, its own repo `wealthcx01/elite-vault`).
Harvest the patterns; do not copy the LabCI content.

## Normative documents (read before any work)

- `docs/holy-corner-plan.md` — the plan. **Decisions D1–D10 are binding** until amended by PR.
- `docs/commercial-record.md` — the three contracts and two invoices the system must hold on day one, read from the signed documents.
- `docs/source/Holy-Corner-PRD-v1.md` and `docs/source/Advisory-Platform-Concept-Summary.md` — the February 2026 originals. **Historical.** They predate grassmarket and fountainbridge; where they disagree with the plan, the plan wins.
- `docs/tickets/` — `HC-nnn-slug.md`. One ticket = one branch = one PR.

Where the plan and a ticket disagree, the ticket's **Scope** wins for what ships in that PR; the plan
wins on intent. Decisions change only by PR to the plan.

## Non-negotiables

These are the fountainbridge and grassmarket rules, carried over. They were learned expensively
there; nothing here relaxes them.

1. **One ticket = one branch = one PR.** Tickets are markdown in `docs/tickets/` (`HC-nnn-slug.md`),
   branch names are `hc-nnn-slug`. Work only the ticket on the branch. Discovered work becomes a new
   ticket file in the PR or a follow-up — never scope creep. Ticket numbers come from
   `max(existing)+1`, read from the directory at filing time, never `HC-NEW` (fountainbridge FB-097).
2. **Merge on green; gate externally, not internally.** A PR merges once CI is green (lint +
   typecheck + test + build + design contract + ticket drift + the **Playwright UI gate**, which is a
   required check from day one) and it has passed `/review`. `main` is branch-protected server-side:
   PR + passing CI required, 0 required approvals. The absolute, never-bypassed gate is on
   **external actions** — sending an invoice, an email, a reminder, a payment instruction, a deploy —
   which require a recorded human approval (`approval.proposed` → `approval.granted`) before they run.
3. **Fail loud, never silently fall back.** A missing required input, an unknown key, an unmatched
   payment, an extraction the model was unsure of: refuse, surface, and say why in plain language.
   No `.get(key, default)` on a money path. Nothing is fabricated, null-filled or defaulted around.
4. **Money is integers in minor units with a currency, and never mixes currencies in one sum.**
   Banker's rounding. An FX conversion is a recorded event with a rate, a source and a date, never
   a hardcoded table (Elite Vault's `FX_RATES` is the anti-pattern). Score-points, percentages and
   currency never share an equation (grassmarket ADR-0002).
5. **AI proposes, humans approve.** Every AI output — a contract extraction, a drafted invoice, a
   matched payment, a written brief — is a proposal until a named person accepts it, and that
   acceptance is a recorded event. A tool call the model claims to have made is rendered as a
   visible action with its real outcome (fountainbridge FB-062). The model never executes an
   external action directly.
6. **Contract-typed everything, through bcap-contracts.** Every resource that crosses a system
   boundary (Entity, Person, Contract, Invoice, Payment, Commission, Engagement, Venture, Approval)
   is a bcap-contracts type (Pydantic v2 + JSON Schema → generated TypeScript). Schema changes
   happen in that package, in the grassmarket repo, consumed here as generated types. Schemas win on
   conflict. Do not hand-author a parallel type (fountainbridge's `tools/ticket-parser/src/types.ts`
   is the cautionary tale).
7. **Reads from the verticals are reads.** Holy Corner reads grassmarket and fountainbridge through
   their own APIs and records, with an admin identity, and writes back only through those systems'
   own gated write paths (an "act-as" or "open as founder" deep link, an approval, a webhook). It
   never reaches into another studio's database.
8. **Scoping is server-side and role-based.** Roles: `admin` (founders / managing partners, sees
   everything), `exec` (pillar leads, cross-pillar read), `finance` (revenue, invoicing, payables),
   `staff` (role-scoped). Enforced in the repository layer before any data is fetched, tested
   explicitly from day one. Identity is a Google Workspace account on `@bruntsfield.capital` (the
   Holy Corner vertical-login pattern), with the fountainbridge password door (FB-092) for accounts
   that cannot complete Google. Never a personal `@gmail.com`.
9. **No secrets in the repo.** Not in code, tickets, fixtures, screenshots, gbrain or `docs/`. Bank
   account numbers live in Wise. Credentials live in the Railway environment. `.env.example` names
   every variable the app reads, because an undocumented variable is how a surface stays broken for
   weeks (fountainbridge FB-087).
10. **Built with gstack; gates never bypassed.** `/plan-ceo-review` before large or ambiguous work,
    `/review` (staff-engineer audit) + `/qa` before every PR, `/ship` to finalise, `/retro` at phase
    close-outs. No `--no-verify`. gbrain records decisions and cross-session context for this lane.
11. **Look at the screen, beside its design, before the PR.** Any change that touches a screen is
    not verified until that screen has been rendered in a browser at **1440×1000 and 393×851** and
    looked at as a picture, with its height recorded in the PR. Where a design exists, render it
    beside the screen. A screen can be entirely correct and completely unusable; only looking finds
    that (fountainbridge FB-124: 9,908px against a design of 1,900, every automated gate green).
    `docs/design-conformance.md` is the scorecard; add a line to it.
12. **Write for the person who has to read it: simple, clear, detailed, direct English.** Tickets,
    PR bodies, commit messages, comments, every word rendered in the product, and the last message
    of every turn. Short sentences. The plain word over the clever one. Say what happened, what it
    means, then what to do. Name the thing. Some readers are not technical and none should need to
    be. `copy-lint` catches the vocabulary rules it can check; this covers the rest. The last
    message of a turn must stand on its own.

## Stack (Decision D3)

- **App:** Next.js (App Router) + TypeScript + React, npm (`npm ci`, lockfile is the contract),
  Node 22. Same shape as fountainbridge so the two studios and the hub feel identical to operate.
- **Data:** PostgreSQL on Railway (the grassmarket pattern), migrations in-repo, one repository
  layer (`lib/data/repository.ts`) that all persistence goes through. PGLite for unit tests. No
  SQLite in production (two writers and a long-running server; Elite Vault's single file does not
  survive that).
- **Auth:** Auth.js with Google (primary) + the password door, edge-safe `auth.config.ts` /
  Node `auth.ts` / JWT-only `middleware.ts` split, `lib/authz.ts` as a pure tested function.
- **Contracts:** `bcap-contracts` (grassmarket `packages/bcap_contracts`), JSON Schemas vendored
  into `schema/` and TypeScript generated from them in CI with a parity check.
- **AI:** Anthropic Claude via the Anthropic SDK, model `claude-sonnet-5` for extraction, drafting
  and the composer; `claude-haiku-4-5-20251001` for background work (memory, classification).
  Called server-side only; the key never reaches the browser (the fountainbridge composer proxy).
  Not Bedrock: Elite Vault's Nova client is the pattern, not the provider.
- **Approvals:** an append-only, HMAC-signed event log (`approval.proposed` → `granted` →
  `executed`) in Postgres, projected to status — the fountainbridge ActiveGraph model, on a real
  event store from the start (FB-171).
- **Payments:** Wise Business, **read-only** (balances, activities, statements) to match receipts to
  invoices. Holy Corner never initiates a transfer. The access route is decided by SD3-0108's
  tested findings, not by a snippet.
- **Branding:** fountainbridge `app/globals.css` verbatim — paper/ink palette, Bottle Green
  `#1a3b26` as the only chromatic colour, Source Serif 4 / Inter / IBM Plex Mono, five status tones.
  **Do not invent a theme.** `design-lint` enforces tokens-only.
- **Hosting:** Railway, `railway.json`, `/api/health`, domain `os.bruntsfieldcapital.com`.
- **CI:** GitHub Actions, ten named jobs whose names never change so branch protection never needs
  reconfiguring (fountainbridge `ci.yml` is the template).

## Layout

```
holy-corner/
├── CLAUDE.md                 # this file — the non-negotiables
├── README.md                 # read order + conventions + running it
├── docs/
│   ├── holy-corner-plan.md   # D1–D10 (normative), phases 0–4
│   ├── commercial-record.md  # the contracts and invoices, from the documents
│   ├── design-conformance.md # the screen-by-screen scorecard (created by HC-006)
│   ├── source/               # the February 2026 PRD + concept summary, converted
│   ├── adr/                  # architecture decision records
│   └── tickets/              # HC-nnn-slug.md
├── .github/workflows/ci.yml  # lint + typecheck + test + build + ui-gate + design + drift
├── schema/                   # vendored bcap-contracts JSON Schemas (HC-005)
├── app/ components/ lib/     # the Next.js app (arrives HC-002)
├── scripts/                  # design-lint, copy-lint, ticket-drift, mint-password-login
├── e2e/                      # Playwright UI gate + screenshot gallery
└── elite-vault/              # gitignored reference copy of the LabCI project
```

The app does not exist yet — HC-002 creates it. Do not fabricate it ahead of its ticket.

## Build sequence (see the plan)

0. **Foundations** — HC-001…HC-009: scaffold, shell + tokens, auth, data layer, contracts, UI
   gate, deploy, seed, copy-lint.
1. **The record** — HC-010…HC-020: entities, people, contracts, AI extraction, invoices, Wise,
   revenue engine, partner commissions receivable, consultant payables, documents, cost centres.
2. **The executive view** — HC-030…HC-036: the group ledger, grassmarket and fountainbridge
   connectors, needs-you across verticals, what happened, SSO, the Viewforth seam.
3. **AI parity** — HC-040…HC-045: the inbox, the composer, the approval gate, the brief, alerts,
   memory.
4. **Knowledge and the public door** — HC-050…HC-053.

**Dependency order for phase 0:** HC-001 → HC-002 → HC-003 ∥ HC-004 → HC-005 → HC-006 → HC-007 →
HC-008 ∥ HC-009. Ask before deviating.

## Memory

gbrain is wired for this lane (HC-001). Record decisions and cross-session context there. The
lane-opening note (`holy-corner-lane-opening`) holds purpose, D1–D10, the verticals and the
dependency order.

## Current state

Phase 0, before HC-001. The repo holds docs and tickets only. Next: HC-001 on branch
`hc-001-scaffold`.
