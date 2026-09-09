# Backlog — index only

Detail lives in `docs/tickets/`. Status here mirrors each ticket's `**Status:**` line and
`make ticket-drift` fails CI when the two disagree with git. Ticket numbers are allocated as
`max(existing)+1` at filing time.

Last reconciled: 2026-09-09. HC-001 has merged and is shipped in part: only the gbrain source
registration is outstanding, blocked by a held PGLite lock. HC-054 is superseded, because the
repository went public and branch protection became available. HC-055 and HC-056 are open and each
needs a decision from John.

## Phase 0 — Foundations

| Ticket | Title | Status |
|---|---|---|
| HC-001 | Scaffold the repo: CI, branch protection, gstack, gbrain, the VM lane, a Railway skeleton | Done — shipped in part: gbrain source registration is blocked by the PGLite lock |
| HC-002 | App shell: Next.js, the Bruntsfield tokens, the top bar, design-lint, the glossary | Todo |
| HC-003 | Sign-in: Google and the password door, roles, the admin allowlist, server-side scoping | Todo |
| HC-004 | The data layer: Postgres on Railway, migrations, one repository, PGLite for tests | Todo |
| HC-005 | bcap-contracts for the hub: new types, vendored schemas, generated TypeScript, a parity check | Todo |
| HC-006 | The UI gate: Playwright, the screenshot gallery, the design-conformance scorecard | Todo |
| HC-007 | Deploy: the Railway service, health, the domain, the OAuth client, the env table | Todo |
| HC-008 | Seed and fixtures: the commercial record as data, and a demo mode | Todo |
| HC-009 | copy-lint: plain English as a mechanism, not a hope | Todo |
| HC-054 | Protect the main branch | Superseded by HC-001 — the repo went public, so the block went away |
| HC-055 | railway.json is deprecated and stops working on 1 December 2026 | Todo |
| HC-056 | Take the negotiated terms out of the public repositories | Todo — needs a decision from John on the existing history |

## Phase 1 — The record

| Ticket | Title | Status |
|---|---|---|
| HC-010 | Entities: the group-level organisation register | Todo |
| HC-011 | People: staff, consultants and founders mirrored, client contacts held | Todo |
| HC-012 | The contracts register: documents, lifecycle, structured terms, and the three real contracts | Todo |
| HC-013 | AI contract reading: a PDF becomes proposed terms, validated, accepted by a person | Todo |
| HC-014 | Invoices: the model, a real numbering sequence, the lifecycle, the two Wise invoices | Todo |
| HC-015 | Wise, read-only: receipts matched to invoices, balances, statements | Todo — waits on SD3-0108 |
| HC-016 | The revenue engine: expected cash events from terms, the ledger, multi-currency | Todo |
| HC-017 | Partner commissions receivable: what OpenBB and Brandfetch owe us, deal by deal | Todo |
| HC-018 | Consultant payables beside receivables: gross margin per deal, pay-when-paid closed | Todo |
| HC-019 | Documents from data: an invoice PDF, an MSA and a schedule from templates | Todo |
| HC-020 | Cost centres and a P&L per pillar: expenses, budgets, margin | Todo |
| HC-042 | The approval gate: proposed, granted, executed, on a signed event log (built early) | Todo |

## Phase 2 — The executive view

| Ticket | Title | Status |
|---|---|---|
| HC-030 | The group ledger: every vertical on one screen, coloured by whose attention it needs | Todo |
| HC-031 | The grassmarket connector: the admin reads the Advisory Studio deferred to Holy Corner | Todo |
| HC-032 | The fountainbridge connector: ventures, attention, budgets, approvals, open as founder | Todo |
| HC-033 | Needs you, across the group: every waiting decision in one queue | Todo |
| HC-034 | What happened, across the group: one activity feed | Todo |
| HC-035 | Holy Corner as the sign-in issuer: the claim shape, the shared cookie, the public site's door | Todo |
| HC-036 | The Viewforth seam: what a client will be allowed to see, as data | Todo |

## Phase 3 — AI parity

| Ticket | Title | Status |
|---|---|---|
| HC-040 | The inbox: paste or drop anything, get a proposal | Todo |
| HC-041 | The composer: ask the record, see every action it takes | Todo |
| HC-043 | The brief: a written weekly read of the group, approved before it is sent | Todo |
| HC-044 | Alerts: overdue, expiring, closing windows, milestones | Todo |
| HC-045 | Memory: gbrain for the lane, and for the record | Todo |

## Phase 4 — Knowledge and the public door

| Ticket | Title | Status |
|---|---|---|
| HC-050 | The knowledge base: playbooks, primers, case studies, served to the Advisory Studio | Todo |
| HC-051 | The template library: every agreement we sign, versioned, with variables | Todo |
| HC-052 | The public site's login router and the Holy Corner front door | Todo |
| HC-053 | The Foundry landing page, hosted here | Todo |

## Companion work in other repos

| Where | For | What |
|---|---|---|
| grassmarket `packages/bcap_contracts` | HC-005 | Organisation, Person, Contract, ContractTerm, Invoice, Payment, CommissionReceivable, CostCentre, Expense, ApprovalEvent (v0.3.0) |
| grassmarket | HC-018 | `GET /earnings/admin/lines` |
| grassmarket | HC-031 | six `/admin/*` reads and a service-token principal with `X-Acting-Person` |
| grassmarket | HC-035 | verify Holy Corner-issued tokens via JWKS |
| grassmarket | HC-050 | register a knowledge item as an Academy resource |
| fountainbridge | HC-032 | `GET /api/admin/ledger`, `GET /api/admin/approvals` |
| fountainbridge | HC-035 | accept the shared cookie as a provider |
| fountainbridge | HC-053 | publish the playbook content; redirect `/foundry` and `/playbook` |
| SD3 | HC-015 | SD3-0108's tested answers, repeated for a business profile |
| public site | HC-052 | a LOG IN link to the issuer |
