# Holy Corner — the plan (v1, 9 September 2026)

**Status:** normative. Decisions D1–D10 are binding until amended by PR.
**Author:** John Gallagher (Managing Partner) with the Holy Corner lane.
**Supersedes:** the February 2026 PRD (`docs/source/Holy-Corner-PRD-v1.md`) and concept summary,
which were written before grassmarket and fountainbridge existed and assumed a FastAPI monolith
that would hold every other system's data. That is not what was built. The concept — one hub, the
single source of truth for entities, contracts, revenue and knowledge, with the verticals as
satellites — is unchanged. The shape is.

## 1. What changed since February

| February 2026 assumed | What is true in September 2026 |
|---|---|
| Holy Corner is built first; grassmarket and Viewforth consume its API | grassmarket (262 tickets) and fountainbridge (214 tickets) are live and standalone. Each was built with a **seam** for Holy Corner: bcap-contracts, a repository layer shaped like the future Holy Corner API, a JWT claim shape called "the Holy Corner claim shape", and explicit tickets deferring cross-vertical admin to here |
| FastAPI + SQLAlchemy, evolving the ATLAS backend | ATLAS lives in grassmarket. Holy Corner is a Next.js app on the fountainbridge substrate, Postgres on Railway, reading the verticals through their APIs |
| Entity, people, engagement and assessment management all in Holy Corner | Engagements, assessments, consultant profiles, certification and earnings **live in grassmarket** and stay there. Ventures, lanes, tickets, approvals and budgets **live in fountainbridge** and stay there. Holy Corner holds what neither does: the group-level entity register, contracts, invoices, receipts, the receivable side of commissions, cost centres, and the view across |
| Consultant commission calculation | Built in grassmarket (v7, two streams, pay-when-paid). Holy Corner shows the payable side beside the receivable side and closes the pay-when-paid loop by telling grassmarket when a client has paid |
| Invoicing "generated, payment tracking manual" | Two invoices already issued from Wise Business. Holy Corner registers them, reads Wise to match receipts, and never sends money |
| A JWT with three roles | Google Workspace identity per vertical (the "vertical-login pattern"), admin allowlists, a password door for walkthrough accounts. Holy Corner becomes the SSO issuer later (D8) |
| No AI features in scope | Both studios are AI-first: a LibreChat composer with MCP tools, meeting-intelligence extraction, AI-drafted deliverables, all behind an approval gate. Holy Corner gets the same, aimed at the record |

## 2. Users

| User | Who, today | Role | Sees |
|---|---|---|---|
| Founders / Managing Partners | John Gallagher | `admin` | everything, every vertical, act-as anywhere |
| Executive Management team | to be named | `exec` | cross-pillar dashboards, the record, no act-as |
| Finance / Operations | to be named | `finance` | revenue, invoices, payments, payables, cost centres |
| Pillar leads (future) | Head of Advisory / Foundry / Briefing / Equity | `exec`, pillar-scoped | their pillar in depth, others in summary |
| Internal staff | analysts, engineers | `staff` | what their role needs |

Consultants use grassmarket. Founders use fountainbridge. Clients will use Viewforth. None of them
ever log in here.

## 3. Decisions

**D1 — Holy Corner is the aggregator, not the store of the verticals.** It owns the group-level
record (entities, contracts, invoices, payments, receivable commissions, cost centres, knowledge). It
reads engagements, assessments, consultants and earnings from grassmarket; ventures, attention,
budgets and approvals from fountainbridge. It writes back only through those systems' own gated
paths. The PRD's "every other system reads from Holy Corner" becomes "Holy Corner reads from every
other system, and is the one place that holds what crosses them".

**D2 — Elite Vault is the harvest source for the core, not the codebase.** Its pure revenue engines
(once-off milestones, recurring months, the unified ledger with provenance and confidence), the
document-to-structured-extraction pipeline, the structured-data-to-document generation, the six-stage
inbox automation with per-stage reporting, the kanban and the CRM rollup are all ported with LabCI
content removed. Its auth, SQLite, Bedrock client, hosting reconciliation, widget pricing, and
hand-rolled UI are not. Reasons are in the Elite Vault survey recorded in gbrain and summarised per
ticket.

**D3 — Stack mirrors fountainbridge; data mirrors grassmarket.** Next.js App Router + TypeScript +
npm + Node 22 on Railway; Postgres on Railway with in-repo migrations and one repository layer;
Auth.js with Google; fountainbridge's `globals.css` tokens and `design-lint`; Anthropic Claude
(`claude-sonnet-5` foreground, `claude-haiku-4-5-20251001` background) called server-side only.

**D4 — Contracts through bcap-contracts, extended for the hub.** Entity, Person, Contract,
ContractTerm, Invoice, Payment, CommissionReceivable, CostCentre and ApprovalEvent are added to
`packages/bcap_contracts` in the grassmarket repo (a companion ticket there), JSON Schemas vendored
into `schema/`, TypeScript generated in CI with a parity check. Grassmarket and fountainbridge get
the types for free when they need them.

**D5 — Money and time are strict.** Integer minor units + ISO currency on every amount; banker's
rounding; no cross-currency sum; FX as a recorded event; dates as dates, not strings; every derived
revenue row carries its source, method and confidence (the Elite Vault provenance columns, kept).

**D6 — Wise is read, never written.** Balances, activities and statements are read to match receipts
to invoices and to feed cost centres. The read route (personal token vs OAuth + mTLS vs emailed
statements) is whatever SD3-0108 proves in the sandbox, shared with SD3's own Wise intake. A
transfer is a human action in Wise, recorded here afterwards. This is the payments instance of the
external-action gate.

**D7 — Approval gate from day one, on a real event store.** The fountainbridge ActiveGraph model
(`approval.proposed` → `granted` / `rejected` → `action.executing` → `executed` / `failed`, integer
`seq`, HMAC over the canonical form, verified with a timing-safe compare, unverifiable events refused
and counted) is implemented on Postgres from the first external action, not on git refs. FB-171's
direction, without FB-171's migration.

**D8 — Identity now, SSO later.** Phase 0 ships Google + password login with an admin allowlist
(`HC_ADMIN_EMAILS`, including both of John's addresses) and role assignment in the database.
Phase 2 makes Holy Corner the issuer of the "Holy Corner claim shape" (`sub`, `email`, `role`,
`tier`, `assessor_level`, `iss`, `aud`) so grassmarket verifies its tokens (grassmarket Seam 3), on a
shared `.bruntsfieldcapital.com` cookie once the domain lands.

**D9 — The verticals stay in charge of their own writes.** "Open as advisor" is grassmarket's act-as
(GRS-0208); "open as founder" is fountainbridge's `/venture/<id>` with its strip (FB-136). Holy
Corner deep-links with the admin identity; it does not re-implement either desk.

**D10 — Phase order is record → view → AI.** The executive view is only as good as the record under
it, and the AI features are only safe over a record with a gate. Phase 1 makes the three contracts
and two invoices true in the system; Phase 2 puts the verticals beside them; Phase 3 adds the inbox,
the composer, the brief and the alerts on top.

## 4. Phases and tickets

### Phase 0 — Foundations (HC-001 … HC-009)

| Ticket | Title | Depends on |
|---|---|---|
| HC-001 | Scaffold the repo: CI, branch protection, gstack, gbrain, VM lane, Railway skeleton | — |
| HC-002 | App shell: Next.js, the Bruntsfield tokens, top bar, design-lint, glossary | HC-001 |
| HC-003 | Sign-in: Google + the password door, roles, admin allowlist, scoping | HC-002 |
| HC-004 | The data layer: Postgres on Railway, migrations, one repository, PGLite tests | HC-002 |
| HC-005 | bcap-contracts for the hub: new types, vendored schemas, generated TS, parity check | HC-004 |
| HC-006 | The UI gate: Playwright, screenshot gallery, design-conformance scorecard | HC-003 |
| HC-007 | Deploy: Railway service, health, domain, OAuth client, env table | HC-006 |
| HC-008 | Seed and fixtures: the commercial record as data, a demo mode | HC-005 |
| HC-009 | copy-lint: plain-English rules as a CI check | HC-002 |

### Phase 1 — The record (HC-010 … HC-020)

| Ticket | Title | Depends on |
|---|---|---|
| HC-010 | Entities: the group-level organisation register, types, relationships, pillar flags, timeline | HC-005 |
| HC-011 | People: staff, consultants (mirrored), founders (mirrored), client contacts | HC-010 |
| HC-012 | The contracts register: documents, lifecycle, structured commercial terms, the three real contracts | HC-010 |
| HC-013 | AI contract reading: PDF → structured terms, validated, proposed, accepted | HC-012 |
| HC-014 | Invoices: model, numbering, lifecycle, the two Wise invoices | HC-012 |
| HC-015 | Wise, read-only: receipts matched to invoices, balances, statements | HC-014, SD3-0108 |
| HC-016 | The revenue engine: expected cash events from terms, the ledger, multi-currency | HC-012 |
| HC-017 | Partner commissions receivable: what OpenBB and Brandfetch owe us, per deal | HC-016 |
| HC-018 | Consultant payables beside receivables: gross margin, pay-when-paid closed | HC-017, HC-031 |
| HC-019 | Documents from data: invoice PDF, MSA and schedule from templates, Bruntsfield-branded | HC-014 |
| HC-020 | Cost centres and P&L per pillar: expenses, budgets, margin | HC-016 |

### Phase 2 — The executive view (HC-030 … HC-036)

| Ticket | Title | Depends on |
|---|---|---|
| HC-030 | The group ledger: every vertical on one screen, coloured by whose attention it needs | HC-008 |
| HC-031 | The grassmarket connector: admin reads of consultants, pipeline, engagements, earnings, committee, academy | HC-003 |
| HC-032 | The fountainbridge connector: ventures, attention, budgets, approvals, open as founder | HC-003 |
| HC-033 | Needs you, across the group: every waiting approval in one queue | HC-031, HC-032 |
| HC-034 | What happened, across the group: one activity feed | HC-031, HC-032 |
| HC-035 | Holy Corner as the sign-in issuer: the claim shape, shared cookie, the public site's login door | HC-003 |
| HC-036 | The Viewforth seam: what a client will be allowed to see, as data | HC-012 |

### Phase 3 — AI parity (HC-040 … HC-045)

| Ticket | Title | Depends on |
|---|---|---|
| HC-040 | The inbox: paste or drop anything, get a proposal | HC-013, HC-042 |
| HC-041 | The composer: ask the record, see every action it takes | HC-042 |
| HC-042 | The approval gate: proposed, granted, executed, on a signed event log. **Built right after HC-005**, because every Phase 1 proposal uses it | HC-004, HC-005 |
| HC-043 | The brief: a written weekly read of the group, approved before it is sent | HC-030, HC-042 |
| HC-044 | Alerts: overdue, expiring, closing windows, milestones | HC-016, HC-042 |
| HC-045 | Memory: gbrain for the lane and for the record | HC-001 |

### Phase 4 — Knowledge and the public door (HC-050 … HC-053)

| Ticket | Title | Depends on |
|---|---|---|
| HC-050 | The knowledge base: playbooks, primers, case studies, served to grassmarket | HC-005 |
| HC-051 | The template library: every agreement we sign, versioned, with variables | HC-019 |
| HC-052 | The public site's login router and the Holy Corner front door | HC-035 |
| HC-053 | The Foundry landing page, hosted here (fountainbridge Phase 5) | HC-052 |

## 5. Success criteria (v1)

- The three contracts and two invoices exist in Holy Corner with every structured term above
  matching the signed documents, and a person can see at a glance what is owed, by whom, by when.
- A payment landing in Wise is matched to its invoice without anyone typing a number.
- John can see grassmarket's and fountainbridge's state on one screen, coloured by whose attention
  it needs, and open either studio as the person concerned in one click.
- Nothing external — an invoice sent, an email, a reminder — has ever left without a recorded
  approval, and a test proves an ungated send is refused.
- Every screen has been looked at beside its design at desktop and phone size before it shipped.

## 6. Out of scope for v1

- Any write into grassmarket's or fountainbridge's database.
- Initiating payments or transfers of any kind.
- Viewforth itself (only its seam).
- The Briefing, Equity and Cohort studios (only the entity flags that will feed them).
- E-signature integration (the record holds the signed PDFs; signing happens where it happens today).
- Accounting-system integration (Xero and the like) — the ledger exports; it does not sync.

## 7. Risks

| Risk | Mitigation |
|---|---|
| Wise read access turns out to need OAuth + mTLS, or is not available to a UK/HK business account | SD3-0108 tests every route in the sandbox before any credential exists; HC-015 has a manual mark-as-paid path that works without Wise |
| Grassmarket's admin API is not enough for the oversight views it deferred | HC-031 lists the exact reads it needs and files the companion grassmarket tickets; nothing is scraped |
| The contract model hardens around three documents and cannot take the fourth | Terms are rows of typed term kinds (rate, window, payment, milestone, equity), not columns; the ConnectTrade draft and the consultant agreement are test fixtures for HC-012 before it merges |
| Ticket drift and screens that are "done" but unusable | ticket-drift and the UI gate are required checks from HC-001 and HC-006; design-conformance is a file, not a memory |
| Two of John's email identities | Both are in the admin allowlist; the people record maps identities to one person |
