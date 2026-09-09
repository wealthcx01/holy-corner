<!-- Converted from Holy-Corner-PRD-v1.docx (February 2026, pre-Grassmarket/Fountainbridge). Historical source; see docs/tickets for what is being built. -->

BRUNTSFIELD CAPITAL

Holy Corner

Product Requirements Document & PIV Loop Plan

Version 1.0  |  February 2026  |  CONFIDENTIAL


# 1. Product Overview

Holy Corner is the Bruntsfield Capital Operating System: the central, internal-only platform that holds the single source of truth for all Bruntsfield operations. Named after the Edinburgh junction where four roads converge, it is the foundation on which all other Bruntsfield systems (Grassmarket, Viewforth, and future pillar tools) are built.

Holy Corner is never exposed to external users. It serves Bruntsfield founders, staff, pillar leads, and finance/operations. External systems (Grassmarket for advisors, Viewforth for clients) connect to Holy Corner via API, reading from and writing to the same underlying data.


## 1.1 Why Holy Corner First

Every other system depends on Holy Corner. Without the entity model, engagement lifecycle, and revenue tracking, neither Grassmarket nor Viewforth can function. Holy Corner also delivers immediate operational value: Bruntsfield can manage its Advisory business from day one through the admin interface, even before dedicated advisor and client portals exist.


## 1.2 Users

| User | Role | Access |
|---|---|---|
| Founders / Managing Partners | Full visibility and control across all pillars | Full admin |
| Pillar Leads (future) | Head of Advisory, Briefing, Foundry, Equity | Pillar-scoped + cross-pillar views |
| Internal Staff | Analysts, engineers, designers | Role-scoped |
| Finance / Operations | Revenue, invoicing, commission processing | Finance module access |


# 2. Core Modules


## 2.1 Entity Management

The entity model is the backbone of Holy Corner. Every external organisation Bruntsfield touches is a single entity, regardless of which pillar encountered it first.


### Entity Record

- Unique identifier and canonical name
- Entity type: Brokerage / Platform, Infrastructure Vendor, Data Provider, PE/Investment Firm, Regulator, Association, Other
- Market segment: Wealth Management, Retail Brokerage, Institutional, Market Infrastructure, etc.
- Geographic coverage: primary markets, jurisdictions
- Key contacts: people associated with this entity (linked to People records)
- Pillar flags: which pillars have interacted with this entity (Briefing subject, Advisory prospect/client, Foundry partner, Equity target)
- Entity timeline: chronological log of every interaction across all pillars
- Tags and notes: free-form classification
- Status: Active, Inactive, Archived

### Entity Relationships

Entities can be linked: a brokerage uses infrastructure from a vendor; a vendor is owned by a PE firm; a data provider serves multiple platforms. These relationships are stored as typed edges between entities: uses, owns, supplies, competes_with, partners_with.

Design principle: the entity model must accommodate all four pillars from day one, even though only Advisory will use it initially. A brokerage that appears in a Briefing piece must be the same entity that later becomes an Advisory client.


## 2.2 People Management


### Internal Staff

- Profile: name, role, pillar assignment, contact details
- Permissions: role-based access control

### Advisory Network Consultants

- Profile: background, expertise domains, sector coverage, geographic reach, vendor familiarity
- Contract status: Pending, Active, Inactive, Terminated
- Tier: Venture Associate, Advisor, Consultant
- Certification status: which modules completed, practical assessment passed/pending
- Quality metrics: engagement count, average client rating, conversion rate
- Availability: current status and calendar
- MSA status: acknowledged date, expiry

### Client Contacts

- Linked to their entity
- Role and seniority within the client organisation
- Primary contact flag per engagement
- Communication preferences

### Equity Cohort Members (future)

- Batch number, status, assessment scores
- Will be needed when Equity pillar launches

## 2.3 Engagement Management

An engagement represents any structured interaction between Bruntsfield and a client. The engagement lifecycle is:

| Stage | Description | Key Data |
|---|---|---|
| Prospect | Opportunity identified. Basic details captured. | Source (consultant/Briefing/inbound), initial entity link, assigned consultant |
| Workshop Scheduled | Platform Power Workshop agreed and scheduled | Date, consultant, pre-workshop brief status |
| Workshop Delivered | Workshop completed, output document produced | Workshop output document, client feedback, conversion assessment |
| Qualified | Genuine opportunity confirmed post-workshop | Estimated value, engagement type, probability |
| Scoped | Engagement type defined, pricing agreed, SOW drafted | SOW document, pricing, deliverables list, timeline |
| Contracted | Client signed. Engagement is active. | Signed SOW, start date, payment terms |
| Active / In Delivery | Work in progress | ATLAS assessment status, deliverable progress, consultant hours |
| Delivered | Primary deliverables complete | All deliverables submitted, client sign-off |
| Closed | Engagement finished | Final revenue, client feedback, case study flag, lessons learned |
| Nurture | Workshop did not convert; prospect in nurture flow | Re-approach date, nurture triggers, notes |


### Engagement Types

- Platform Power Workshop (free/paid)
- Module Deep Dive
- Platform Power Diagnostic (Express / Standard / Complex)
- Due Diligence Support
- Retainer: Monitoring Mode
- Retainer: Active Advisory Mode

### Engagement Attributes

- Linked entity (client) and contacts
- Engagement type and variant
- Sourcing attribution: who originated this (consultant name, Briefing reference, inbound)
- Delivery attribution: who is delivering the work
- Revenue: total value, payment schedule, invoiced amounts, paid amounts
- Commission: calculated splits based on attribution and consultant tier
- Deliverables: list of expected outputs with completion status
- ATLAS assessment link (if applicable)
- Timeline: start date, expected end, actual end
- Status and stage (per lifecycle above)

## 2.4 Revenue, Contracting & Invoicing


### Contracting

- MSA templates for consultants: standard contract, digitally acknowledged during onboarding
- Client engagement contracts: Statement of Work (SOW) / engagement letter per engagement
- Template library per engagement type with standard terms, scope descriptions, pricing
- Contract status tracking: Drafted, Sent, Signed, Active, Expired, Terminated
- PDF generation with signature fields (e-signature integration as future enhancement)

### Revenue Tracking

- Every engagement has a revenue line: total value, payment terms, payment schedule
- One-off engagements: milestone-based or on-completion billing
- Retainers: monthly recurring amounts with contract period
- Revenue by period: monthly, quarterly, annual views
- Revenue by dimension: by client, by consultant, by engagement type, by pillar

### Commission Calculation

- Automatic split calculation based on engagement attribution and consultant tier
- Self-sourced + closed: highest percentage (exact rates TBD)
- Bruntsfield-sourced, consultant delivers: lower percentage
- Co-sourced: defined middle rate
- Workshop Recovery Fee: USD 2,500-3,000 paid when workshop converts to engagement (within 12-month attribution window)
- Retainer commission: ongoing percentage of monthly retainer payments
- Consultant earnings dashboard: earned, invoiced to Bruntsfield, paid out, pending
- Admin view: total consultant payables vs. gross revenue = gross margin per engagement

### Invoicing

- Generate client invoices from engagement data
- Track payment status: Invoiced, Paid, Overdue, Written Off
- Generate consultant payment statements from commission calculations
- Overdue alerts and ageing reports

### Cost Centres

- Map every expense to a pillar (Advisory, Briefing, Foundry, Equity)
- Optionally map to specific engagement
- P&L view per pillar

## 2.5 Knowledge Base

Centralised repository of institutional knowledge, accessible by all authorised internal users and surfaced selectively in Grassmarket.

- Briefing archive: every published analysis
- Case studies: anonymised completed engagements (added per engagement at close)
- Playbooks: Bruntsfield methodology, sales approaches, delivery standards
- Technical primers: legacy systems, strangler patterns, vendor landscapes
- Templates: SOW templates, deliverable templates, presentation templates
- Monthly digest: patterns across engagements (produced manually initially)
- Content is stored in Holy Corner and served to Grassmarket via API. Consultants consume it; admin manages it.

## 2.6 Cross-Pillar Intelligence

Admin-only analytics that make Holy Corner strategically valuable beyond operational management.

- Entity frequency: which entities appear most across pillars (feeds Equity targeting)
- Infrastructure pattern detection: which modules are consistently weak across clients (feeds Foundry)
- Pipeline health: conversion rates, average deal size, time-to-close by engagement type
- Revenue analytics: recurring vs. one-off, by consultant, by client segment
- Thesis validation: are high Platform Power scores correlated with commercial outcomes?
Most of these analytics become meaningful only after 10+ completed engagements. Build the data model to capture the inputs from day one; build the visualisations when the data justifies it.


# 3. API Design

Holy Corner exposes a RESTful API that Grassmarket, Viewforth, and future systems consume. Key design principles:

- JWT authentication with role-based access control
- Scoped endpoints: consultants can only access their own engagements and entities they are attributed to
- Client endpoints: clients can only access their own entity, engagements, and deliverables
- Admin endpoints: full CRUD on all resources
- Webhook support: Holy Corner can notify satellite systems of state changes (e.g., engagement status updated, new deliverable uploaded)
- Versioned API (v1) to allow independent evolution of satellite systems

### Key API Resources

| Resource | Endpoints | Consumers |
|---|---|---|
| Entities | CRUD, search, relationship management, timeline | Grassmarket (read/write), Viewforth (read own) |
| People | CRUD, profiles, certification status, availability | Grassmarket (read/write own profile), Admin |
| Engagements | CRUD, lifecycle transitions, attribution | Grassmarket (read/write own), Viewforth (read own) |
| Assessments | CRUD, scoring engine trigger, results | Grassmarket (read/write), Viewforth (read own scores) |
| Deliverables | Upload, status tracking, access control | Grassmarket (write), Viewforth (read own) |
| Revenue | Invoices, commissions, payments, reporting | Grassmarket (read own commissions), Admin |
| Contracts | Templates, SOW generation, status | Grassmarket (read), Admin (full) |
| Knowledge | Content CRUD, categorisation, search | Grassmarket (read), Admin (full) |


# 4. Technical Architecture


## 4.1 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Backend | FastAPI (Python) | Already proven in ATLAS prototype; excellent for API-first design |
| Database | PostgreSQL | Already operational in ATLAS; robust relational model for entity/engagement data |
| ORM | SQLAlchemy | Already in use; good for complex relationship models |
| Authentication | JWT with role-based claims | Supports multi-tier access (admin, consultant, client) |
| File Storage | S3-compatible object storage | For deliverables, documents, recordings |
| Admin Frontend | React or Next.js | Internal dashboard for Bruntsfield staff |
| API Documentation | OpenAPI / Swagger | Auto-generated from FastAPI; enables Grassmarket/Viewforth development |


## 4.2 Data Model (Simplified)

Core tables and their key relationships:

- entities: id, name, type, segment, geography, status, created_at
- entity_relationships: entity_a_id, entity_b_id, relationship_type
- people: id, name, email, role_type (staff/consultant/client_contact/cohort), entity_id (nullable)
- consultant_profiles: person_id, tier, certification_status, availability, quality_score
- engagements: id, entity_id, type, variant, stage, source_consultant_id, delivery_consultant_id, total_value, start_date, end_date
- engagement_events: engagement_id, timestamp, stage_from, stage_to, notes, actor_id
- assessments: id, engagement_id, entity_id, status, input_method, scoring_data (JSONB)
- deliverables: id, engagement_id, type, status, file_path, created_at
- invoices: id, engagement_id, amount, status, due_date, paid_date
- commissions: id, engagement_id, consultant_id, amount, type (sourcing/delivery/recovery), status
- contracts: id, entity_id or consultant_id, type (MSA/SOW), status, document_path
- knowledge_items: id, type (briefing/case_study/playbook/primer), title, content, tags
The ATLAS scoring model data (assessment inputs, module scores, subcomponent scores) is stored as structured JSONB within the assessments table, allowing flexible schema evolution without migrations.


## 4.3 Relationship to Existing ATLAS Backend

The existing FastAPI + PostgreSQL backend with the ATLAS scoring engine is directly reusable. The recommendation is to evolve the existing codebase rather than rebuild:

- Expand the data model to add entities, engagements, people, revenue, and contracts
- Refactor the existing scoring engine into a service module that Holy Corner calls
- Add JWT authentication with role-based claims (extending what already exists)
- Add the API layer that Grassmarket and Viewforth will consume
- The existing admin bootstrap and database infrastructure carry forward

# 5. PIV Loop Plan

Following the Cole Medin PIV (Plan-Implement-Validate) framework, Holy Corner is built in iterative loops. Each loop produces a working increment that can be tested and validated before the next begins.


## PIV Loop 1: Foundation

Goal: Core data model, authentication, entity and people management. The minimum viable Holy Corner.


### Plan

- Define database schema for entities, people, consultant_profiles
- Design JWT auth with three role types: admin, consultant, client
- Design entity CRUD API endpoints
- Design people CRUD API with consultant profile extensions

### Implement

- Database migrations (extending existing ATLAS schema)
- Entity model: CRUD, search, relationship management
- People model: CRUD, consultant profiles with tier/certification/availability
- Authentication: JWT issuance, role-based middleware, invitation flow
- Basic admin dashboard: entity list, people list, entity detail view

### Validate

- Can create, read, update, search entities
- Can create consultant profiles with tier and certification status
- JWT auth works with role-based access control
- Entity relationships can be created and queried
- Admin can view all data; test consultant scoping
Estimated duration: 1-2 weeks


## PIV Loop 2: Engagement Lifecycle

Goal: Full engagement management with lifecycle stages, attribution, and basic deliverable tracking.


### Plan

- Define engagement schema with all stages and types
- Design lifecycle state machine (valid transitions)
- Design attribution model (sourcing vs. delivery consultant)
- Design engagement events log

### Implement

- Engagement model: CRUD, lifecycle transitions with event logging
- Attribution tracking at engagement level
- Engagement types and variants (Workshop, Deep Dive, Diagnostic, DD, Retainers)
- Deliverable model: upload, status tracking, access control
- Workshop tracking: scheduled, delivered, output status, conversion
- Admin dashboard: engagement pipeline view, stage filters, consultant attribution

### Validate

- Can create an engagement and progress it through all lifecycle stages
- Attribution correctly links sourcing and delivery consultants
- Engagement events log captures all transitions with timestamps
- Deliverables can be uploaded and linked to engagements
- Pipeline view shows engagements by stage with correct counts
Estimated duration: 1-2 weeks


## PIV Loop 3: Revenue & Commissions

Goal: Financial tracking: invoicing, commission calculation, payment status.


### Plan

- Define invoice schema and generation logic
- Define commission calculation rules per tier and attribution type
- Design Workshop Recovery Fee logic with 12-month attribution window
- Design revenue reporting views

### Implement

- Invoice model: generation from engagement data, status tracking, overdue alerts
- Commission engine: automatic calculation on engagement closure/milestone
- Workshop Recovery Fee: triggered on conversion, tracked per consultant
- Payment tracking: invoiced, paid, pending for both client invoices and consultant commissions
- Revenue dashboard: by period, by client, by consultant, by engagement type
- Consultant earnings view: earned, invoiced, paid, pending

### Validate

- Invoices generate correctly from engagement pricing data
- Commission splits calculate correctly for all attribution scenarios
- Workshop Recovery Fee triggers on conversion and respects 12-month window
- Revenue reports are accurate and filterable
- Edge cases: co-sourced deals, mid-engagement consultant change, partial delivery
Estimated duration: 1-2 weeks


## PIV Loop 4: Contracting & Templates

Goal: SOW generation, contract status tracking, MSA management.


### Plan

- Design SOW template system per engagement type
- Define contract lifecycle (drafted, sent, signed, active, expired)
- Design template variable injection (client name, scope, pricing, dates)

### Implement

- Contract model: CRUD, status tracking, document storage
- SOW template engine: generate documents from engagement data + templates
- MSA tracking for consultants: acknowledgment status, expiry dates
- Template library management: admin can create/edit templates per engagement type
- PDF generation for SOWs and contracts

### Validate

- SOW generates correctly from template + engagement data
- Contract status lifecycle works end-to-end
- Consultant MSA status is tracked and visible
- Generated PDFs are professional and accurate
Estimated duration: 1 week


## PIV Loop 5: Knowledge Base & Cross-Pillar Foundation

Goal: Centralised knowledge repository and the foundations for cross-pillar intelligence.


### Plan

- Design knowledge item schema (type, title, content, tags, access control)
- Design entity timeline aggregation
- Design basic cross-pillar analytics queries

### Implement

- Knowledge model: CRUD, categorisation, tagging, search
- Content types: Briefing, Case Study, Playbook, Primer, Template
- Entity timeline: aggregate all interactions across modules into chronological view
- Basic analytics: entity frequency, pipeline health metrics, revenue summaries
- Admin dashboard: knowledge base management, entity timeline view

### Validate

- Knowledge items can be created, categorised, searched
- Entity timeline correctly aggregates engagements, Briefing mentions, notes
- Analytics queries return accurate data
- Knowledge base content is accessible via API (ready for Grassmarket consumption)
Estimated duration: 1 week


## PIV Loop 6: API Layer for Satellite Systems

Goal: Expose Holy Corner data via versioned, scoped API endpoints that Grassmarket and Viewforth will consume.


### Plan

- Define API v1 specification (OpenAPI/Swagger)
- Design scoping rules: what each role can access
- Design webhook system for state change notifications

### Implement

- Versioned API endpoints for all resources (entities, people, engagements, assessments, deliverables, revenue, knowledge)
- Scoped access: consultant endpoints return only their data; client endpoints return only their entity data
- API documentation auto-generated from FastAPI
- Webhook framework: satellite systems can subscribe to events
- Rate limiting and API key management for satellite systems

### Validate

- Full API test suite covering all endpoints and scoping rules
- Swagger documentation is complete and accurate
- Webhook delivery works for key events (engagement status change, deliverable uploaded)
- Performance testing: API responds within acceptable latency under load
Estimated duration: 1-2 weeks


# 6. PIV Loop Summary

| Loop | Focus | Duration | Key Output |
|---|---|---|---|
| 1 | Foundation: entities, people, auth | 1-2 weeks | Core data model, RBAC, admin dashboard |
| 2 | Engagement lifecycle | 1-2 weeks | Full pipeline management, attribution, deliverables |
| 3 | Revenue & commissions | 1-2 weeks | Invoicing, commission engine, financial reporting |
| 4 | Contracting & templates | 1 week | SOW generation, contract tracking, PDF output |
| 5 | Knowledge base & analytics | 1 week | Content repository, entity timeline, basic analytics |
| 6 | API layer for satellites | 1-2 weeks | Versioned API, scoping, webhooks, documentation |

Total estimated duration: 6-10 weeks for a fully functional Holy Corner that Grassmarket and Viewforth can build against.

After Loop 2, Bruntsfield has a working system for managing Advisory operations internally. After Loop 6, Grassmarket development can begin in parallel.


# 7. Success Criteria

- All Advisory engagements managed through Holy Corner (no spreadsheets)
- Commission calculations are automatic and accurate
- Every external organisation exists as a single entity regardless of pillar
- Admin dashboard provides clear pipeline, revenue, and consultant performance visibility
- API is documented and ready for Grassmarket/Viewforth integration
- System handles 50+ entities, 20+ engagements, and 15+ consultants without performance issues

# 8. Out of Scope for v1

- Cross-pillar analytics visualisations (data model supports it; dashboards deferred)
- E-signature integration (PDF generation with signature fields is sufficient)
- Automated email notifications (manual process initially)
- Billing system integration (invoices generated, payment tracking manual)
- Equity, Foundry, Briefing pillar modules (data model accommodates; features deferred)
- Intelligence products (Platform Power Index, Competitive Landscape Brief) - require scale

# 9. Dependencies & Risks

| Risk | Mitigation |
|---|---|
| Entity model too rigid for multi-pillar use | Use flexible tagging and JSONB metadata alongside structured fields |
| Commission rules change frequently | Rule engine with configurable rates, not hardcoded calculations |
| ATLAS scoring model evolves | JSONB storage for assessment data allows schema flexibility |
| API design locks satellite systems into constraints | Version API; design endpoints around resources not views |
| Scope creep from trying to build all four pillars | Strict focus on Advisory operations; data model only for other pillars |
