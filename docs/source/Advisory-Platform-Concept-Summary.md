<!-- Converted from Bruntsfield-Advisory-Platform-Concept-Summary.docx (February 2026). Historical source. -->

BRUNTSFIELD CAPITAL

Advisory Platform Architecture

Concept Summary & Platform Design

Holy Corner  |  Grassmarket  |  Viewforth

Version 1.0  |  February 2026  |  CONFIDENTIAL


# 1. Context & Thesis

Bruntsfield Capital is built on a core hypothesis: technical debt in wealth management and brokerage infrastructure is a latent asset class. Financial platforms run on 10-25 year old systems originally built for institutional trading, not retail. Complexity layers suppress value. Generative AI now enables safe modernisation via the strangler gateway pattern.

The investment focus is on commercially resilient but technically constrained infrastructure vendors (connectivity, OMS, entity data, risk engines) that sit beneath multiple platforms. Bruntsfield does not buy brokers or platforms; it targets the rails underneath.


## 1.1 The Four-Pillar Flywheel

Briefing: Public analysis of platforms and vendors, maps platform power, surfaces opportunities.

Advisory: Paid modernisation work with platforms and vendors using proprietary assessment framework (ATLAS).

Foundry: Venture studio building infrastructure-native products on modernised gateways.

Equity: Acquire and control underlying technology vendors via operator cohort programme.

Each pillar feeds the others. Briefing generates Advisory leads. Advisory generates patterns that inform Foundry builds. Foundry creates tools that enhance Advisory delivery. All three surface Equity targets.


## 1.2 Platform Power Framework

Bruntsfield assesses infrastructure through two lenses:

Structural (Hamilton Helmer's 7 Powers): Scale economies, switching costs, network effects, cornered resources, process power, counter-positioning, branding.

Dynamic (Platform Power): Three questions that define platform power:

- Economic Value: How does the platform create economic value, and does it compound with scale?
- Perceived Value: How do key customer segments perceive that value, and is perception strengthening or weakening?
- Defence Value: What realistically prevents a competitor from reaching parity?

# 2. The Advisory Platform: Three Systems

The Advisory pillar requires an operational platform to manage consultants, engagements, assessments, and client delivery. After extensive analysis, the platform has been decomposed into three decoupled systems, each serving a distinct user group but connected through a shared data layer.


## 2.1 Architecture Overview

Holy Corner (The Bruntsfield Capital Operating System) is the central hub. Named after the Edinburgh junction where four roads converge, it holds the single source of truth: entities, engagements, revenue, contracts, and knowledge. All other systems read from and write to Holy Corner via API.

Grassmarket (The Advisor Platform) is the external-facing tool for the Advisory Network. Consultants manage their pipeline, run ATLAS assessments, generate deliverables, and access the workbench. Named after Edinburgh's historic commercial square where goods were traded.

Viewforth (The Client Portal) is the external-facing portal for Advisory clients. Clients view their assessments, download deliverables, and track engagement progress. Named after the street connecting Bruntsfield to Tollcross.

Future pillar tools will follow the same pattern:

- The Meadows: Briefing platform (public-facing analysis)
- Tollcross: Foundry project management
- Marchmont: Equity deal tracker
- Morningside: Operator Cohort platform

# 3. Advisory Propositions

The proposition ladder is designed around a core principle: each tier answers a question that the previous tier raised but could not resolve. The client never feels sold to; each step is a natural continuation.


## 3.1 The Platform Power Workshop (Free / Low-Cost Entry)

A structured 90-120 minute working session. Not a pitch meeting; an actual working session where both sides leave with something they did not have before.

Before the workshop (advisor homework, 2-4 hours): Advisor prepares a Pre-Workshop Brief using Briefing content, public information, and domain knowledge. ATLAS is used in external mode. Brief shared with client 24-48 hours prior.

During the workshop (90-120 minutes): Advisor presents the brief (20 min), structured discussion working through three Platform Power questions (60 min), identification of 2-3 critical open questions (20 min).

After the workshop (advisor homework, half day): Advisor synthesises into a 3-5 page Workshop Output capturing what was discussed, updated hypotheses, critical questions, and a clear next-steps section.


### Workshop Economics

The consultant invests roughly one day total (unpaid). This is their sales investment, their skin in the game. If the workshop converts to a paid engagement, the consultant receives a Workshop Recovery Fee (USD 2,500-3,000) on top of their standard commission. If it does not convert, the consultant absorbs the cost.

This creates a natural quality filter: consultants will not waste a day on prospects they do not believe will convert. Bruntsfield's cost is effectively zero for workshops; consultants are the sales force on commission-only with a recovery mechanism.

Attribution window: 12 months. If a workshop prospect converts within 12 months, the original consultant gets their recovery fee and sourcing credit.


## 3.2 Paid One-Off Engagements


### Platform Power Diagnostic (Flagship)

A full ATLAS assessment covering all 9 infrastructure modules, subcomponent scoring, bottleneck detection, latent value calculation, and modernisation roadmap.

| Variant | Duration | Price Range |
|---|---|---|
| Express (2-3 modules, focused) | 2-3 weeks | USD 25,000-40,000 |
| Standard (mid-tier broker/vendor) | 4-6 weeks | USD 45,000-75,000 |
| Complex (large platform, multi-geo) | 4-6 weeks | USD 80,000-120,000 |

Standardised deliverables: Executive Summary (3 pages, board-ready), Full Platform Power Report (B/P/L/V scores), Infrastructure Heatmap, Modernisation Roadmap (ROI-ranked), Technical Appendix, Leadership Presentation (60-90 min).


### Module Deep Dive

A targeted assessment of 2-3 specific ATLAS modules. Ideal for clients testing the relationship or with a known pain point. Duration: 2-3 weeks. Price: USD 15,000-30,000.


### Due Diligence Support

ATLAS applied in M&A context. Assesses target platform power and infrastructure quality for buyers, PE firms, or strategic acquirers. Duration: 4-8 weeks. Price: USD 60,000-150,000+. Potential success fee component on closed deals.


## 3.3 Retainers (Earned, Not Sold)

Retainers are not a product sold from a menu. They are a relationship earned after successful project work. When a Diagnostic proves its value, the conversation naturally becomes: how do we keep this going?

One retainer structure, two modes:

| Mode | What It Includes | Price Range |
|---|---|---|
| Monitoring | Quarterly ATLAS refresh, quarterly advisory call, annual review, Grassmarket dashboard, named advisor | USD 6,000-10,000/month |
| Active Advisory | Everything in Monitoring + embedded days/month, vendor evaluation support, modernisation scoping, async access | USD 15,000-40,000/month |

Minimum commitment: 6 months with preference for 12-month agreements. Intelligence products (Platform Power Index, Competitive Landscape Brief, Modernisation Scorecard) will be introduced as retainer deliverables once sufficient cross-client data exists to make them genuinely valuable.


# 4. The Advisory Network


## 4.1 Consultant Grading

Three tiers reflecting the entrepreneurial nature of the network:

| Tier | Role | Economics | Requirements |
|---|---|---|---|
| Venture Associate | Junior support: research, ATLAS data prep, deliverable drafting. Not client-facing independently. Works under Advisor supervision. | Stipend or project-based fees. Learning-linked bonuses. | Application/invitation. Foundation training completion. |
| Advisor | Standard independent operator. Leads workshops, diagnostics, and retainer relationships. Represents Bruntsfield to clients. | Commission-based with self-sourced premium. Workshop recovery fees. | ATLAS certification. Playbook completion. Practical assessment passed. |
| Consultant | Senior operator with proven track record. Leads complex engagements, mentors others. Potential path to direct Bruntsfield hire. | Higher commission rates. First access to premium opportunities. | 5+ completed engagements. Strong client feedback. Demonstrated BD capability. |


## 4.2 Commission Structure

Commission rates escalate with tier and deal attribution:

- Self-sourced + closed: highest percentage of net advisory revenue
- Bruntsfield-sourced, consultant delivers: lower percentage
- Co-sourced: defined middle rate
- Workshop Recovery Fee: USD 2,500-3,000 paid on conversion (within 12-month window)
- Retainer commission: consultant earns on recurring monthly payments, creating retention incentive

## 4.3 The Workbench & Quality Management

The workbench serves three purposes: certification gate, quality standards, and competitive transparency.

Certification Gate (mandatory before leading engagements):

- Bruntsfield Playbook: thesis, language, ethics, brand
- ATLAS Methodology: framework, scoring, interpretation, presentation
- Workshop Delivery: structure, facilitation, synthesis
- Practical assessment: mock ATLAS assessment on sample case, reviewed by senior person
Quality Standards & Review:

- All deliverables quality-reviewed before client delivery
- Client feedback captured on every engagement (1-5 rating + comments)
- Quality score per consultant visible to admin
- Consistently low scores trigger review; high scores accelerate progression
Competitive Transparency:

- Each consultant sees their own metrics: engagements, ratings, conversion rate, revenue
- Admin sees full leaderboard
- Quarterly network reviews where performance is discussed openly
Learning Content (grows organically):

- Briefing archive, case studies (added per engagement), sales playbooks (old school + new school)
- Technical primers (legacy systems, strangler patterns, vendor landscapes)
- Monthly digest summarising patterns across engagements

## 4.4 Sales Learning Journeys

Old School: Relationship-building fundamentals, enterprise sales cycles, consultative selling, objection handling for infrastructure advisory, account management and growth.

New School: LinkedIn social selling using Briefing content, AI tools in workflow, digital relationship management, content-led selling, workshop-to-close digital workflow.


# 5. AI Acceleration & Transparency

Across all propositions, AI does the mechanical work; humans do the meaningful work.

AI handles: Meeting transcription, structured data extraction into ATLAS inputs, scoring calculations, first-draft report generation, template population, pattern matching against library, workflow automation.

Humans handle: All client-facing conversations, score interpretation in context, hypothesis generation, recommendations, quality review of AI outputs, relationship management.

Client communication: Frame AI as advantage: Bruntsfield's proprietary ATLAS system delivers in 4 weeks what takes traditional firms 4 months. Consultants spend time thinking, not grinding. The framework is systematic; the application is bespoke. The consultant and framework are the stars, never the tool.


# 6. ATLAS Assessment Engine

ATLAS is the proprietary assessment framework that sits inside Grassmarket. It transforms raw information into structured Platform Power scores through two input paths that converge on a single data model.


## 6.1 Input Paths

Path A (Manual Wizard): Consultant walks through structured form steps: Overview, Business Metrics, Strategic Powers (7 Powers), Infrastructure Deep Dive (9 modules with subcomponents), Scenario Analysis.

Path B (Meeting Intelligence): Consultant uploads meeting recording. System transcribes, extracts structured data using AI pipeline mapped to ATLAS input schema, presents to consultant for review and correction. Gaps highlighted for manual completion. Both paths produce identical intermediate data structures.


## 6.2 Scoring Model

5-level hierarchy: Subcomponents -> Module Scores -> Infrastructure Factor (L) -> Platform Value (V) combining Business Score (B), Strategic Power Score (P), and Infrastructure Factor (L). Includes bottleneck detection (min-subcomponent penalties), Latent Value calculation per module, and ROI-based upgrade prioritisation.


## 6.3 Nine Infrastructure Modules

Order Management & Execution, Market Data & Connectivity, Client Lifecycle Management, Portfolio Management & Reporting, Clearing & Settlement, Risk & Compliance, Advice & Planning, Data Architecture & Integration, Platform & Cloud Infrastructure.


# 7. Revenue & Commercial Model


## 7.1 Pricing Summary

| Proposition | Price Range | Duration | Market Comparable |
|---|---|---|---|
| Workshop | Free - USD 5,000 | 1 day total | OW thought leadership + initial meetings |
| Module Deep Dive | USD 15,000-30,000 | 2-3 weeks | Focused tech assessment |
| Platform Power Diagnostic | USD 45,000-120,000 | 4-6 weeks | Specialist tech DD (Sphere, Vaultinum) |
| Due Diligence Support | USD 60,000-150,000+ | 4-8 weeks | M&A tech due diligence |
| Retainer: Monitoring | USD 6,000-10,000/mo | 6-12 month min | Boutique advisory retainer |
| Retainer: Active Advisory | USD 15,000-40,000/mo | 6-12 month min | Embedded advisory |


## 7.2 Delivery Economics

With ATLAS and AI acceleration, a full Diagnostic requires approximately 60-100 consultant hours (vs. 200-300 in traditional model). This enables competitive pricing, high gross margins (55-70%), faster delivery (weeks not months), and more consistent quality.


## 7.3 Sales Funnel

Briefing (free, at scale) -> Workshop (qualification, mutual investment) -> Project Work (Diagnostic/Deep Dive/DD) -> Retainer (earned through proven value). Non-converting workshops enter a nurture flow via Briefing feed and market signals for re-approach.


# 8. System Architecture Summary


## 8.1 Holy Corner (Core System)

Users: Bruntsfield founders, staff, pillar leads, finance/operations

Contains: Entity management (all organisations across all pillars), people management (staff, consultants, contacts), revenue and finance (engagement revenue, commissions, invoicing, cost centres), contracting (MSA templates, SOW generation, status tracking), engagement registry (all engagements across all pillars), knowledge base (case studies, Briefing archive, playbooks), cross-pillar intelligence (entity timelines, pattern detection, pipeline analytics).


## 8.2 Grassmarket (Advisor Platform)

Users: Advisory Network consultants (Venture Associates, Advisors, Consultants)

Contains: Personal dashboard, pipeline management (prospect through closed), ATLAS wizard (manual + meeting recording), deliverable builder (standardised template outputs), the workbench (certification, knowledge base, performance metrics, opportunity radar), earnings tracking (commissions, workshop recovery fees, payment status).

Reads from Holy Corner: Entity data, engagement records (own only), revenue data (own commissions), knowledge base content.

Writes to Holy Corner: New prospects/entities, engagement updates, ATLAS assessment data, deliverable completions, workshop records.


## 8.3 Viewforth (Client Portal)

Users: Advisory clients

Contains: Platform Power Profile (ATLAS scores, visualisations), deliverables (all completed documents), engagement status, recommendations (prioritised modernisation actions with status tracking), quarterly reports (retainer clients).

Reads from Holy Corner: Own entity record, engagements, ATLAS data, deliverables.

Writes to Holy Corner: Feedback ratings, recommendation status updates.


# 9. Build Sequence Recommendation

Start with Holy Corner. It is the foundation everything else depends on. Without the entity model, engagement lifecycle, and revenue tracking, neither Grassmarket nor Viewforth can function. Holy Corner also delivers immediate operational value: Bruntsfield can manage its Advisory business from day one, even before the consultant and client portals exist.

Recommended build order:

- Phase 1: Holy Corner (core entity management, engagement lifecycle, revenue tracking, contracting)
- Phase 2: Grassmarket (ATLAS wizard, pipeline management, deliverable builder, workbench foundations)
- Phase 3: Viewforth (client portal, assessment views, deliverable access)
Each system has its own PRD and PIV loop plan in the accompanying documents.


# 10. Key Decisions Made

| Decision | Outcome | Rationale |
|---|---|---|
| Platform name | Holy Corner / Grassmarket / Viewforth | Edinburgh place names near Bruntsfield; meaningful metaphors |
| Architecture | Three decoupled systems sharing Holy Corner as single source of truth | Mirrors business structure; enables independent build and ship cycles |
| Free tier | Platform Power Workshop with Recovery Fee model | Mutual investment; consultant skin in game; self-funding on conversion |
| Retainer structure | Two modes (Monitoring / Active Advisory), earned not sold | Industry research shows retainers follow proven project value |
| Consultant grading | Venture Associate / Advisor / Consultant (3 tiers) | Entrepreneurial not corporate; VA title attracts ambitious graduates |
| ATLAS input methods | Both manual wizard and meeting recording from day one | Single unified data model regardless of input path |
| AI transparency | Frame as advantage; consultant and framework are stars | Clients value speed and consistency, not AI for its own sake |
| Intelligence products | Deferred to Phase 2+ when data supports them | Need 10-20+ ATLAS assessments before cross-client patterns are meaningful |
| Quality management | TQM practices from day one: certification, review, transparency | Culture and standards set early; not all consultants are equal |


# 11. Open Questions & Risks


## 11.1 Commercial

- Exact commission percentages per tier and attribution type to be finalised
- Workshop pricing policy: which prospects get free vs. paid workshops
- Retainer pricing validation: USD 6-10k/month Monitoring tier needs market testing
- Due Diligence success fee structure and terms

## 11.2 Technical

- Meeting recording AI extraction accuracy for financial infrastructure jargon
- ATLAS scoring model weight calibration (requires real engagement data)
- Integration approach between three systems (API design, auth, data sync)
- Relationship to existing ATLAS backend (evolve vs. rebuild)

## 11.3 Operational

- Client visibility into ATLAS scores: how much of the model do they see?
- Consultant pre-engagement assessments: can they run ATLAS on prospects before contracting?
- Cross-pillar data governance: how Briefing data feeds Advisory without conflicts
- Scale of workbench learning content at launch vs. organic growth