# HC-010 — Entities: the group-level organisation register

**Status:** Todo · **Phase:** 1 · **Depends on:** HC-005, HC-008 · **Repo:** holy-corner ·
**Branch:** `hc-010-entities` · One ticket = one branch = one PR.

## Why this matters (for John)

The February PRD's first principle survives intact: every external organisation Bruntsfield touches
is one record, whichever pillar met it first. OpenBB is an Advisory partner today and might be a
Briefing subject or an Equity target tomorrow; The Reset is a Foundry venture and will be a client of
its own platform. Grassmarket holds prospects "entity-shaped" so that "a later sync maps cleanly";
this is the register it maps to.

## Context

- `Organisation`, `OrganisationRelationship`, `Person` from HC-005.
- Elite Vault `brands` (with `parent_entity`, `account_manager`, `region_coverage` from migration
  011) and `contacts`, its CRM page (`app/dashboard/crm/page.tsx`: grouped by parent, search,
  financial rollup, drill-down) and `app/api/crm/brands/**`. Port the shape; drop the
  `SUM(DISTINCT …)` rollup query and `total_hosting`.
- grassmarket `Prospect` and `CompanyEntity`; fountainbridge `Venture` (slug-keyed). Neither is
  replaced; each gets a pointer to its organisation here.
- PRD §2.1: entity types, segment, geography, pillar flags, timeline, tags, relationships.

## Scope

- Migrations: `organisations`, `organisation_relationships`, `organisation_links` (organisation_id,
  system ∈ grassmarket / fountainbridge / wise / accounting, external_id — how a prospect, a venture
  or a Wise counterparty points at one organisation), `organisation_notes`.
- Repository methods, scoped: `listOrganisations(principal, {search, type, pillar})`,
  `getOrganisation`, `createOrganisation`, `updateOrganisation`, `linkOrganisations`,
  `organisationTimeline` (the union of contracts, invoices, payments, notes, and later grassmarket
  engagements and fountainbridge attention, by date).
- Screens under **The record → Organisations**: the list (search, type and pillar filters, the
  rollup: contracts, open invoices, owed to us, we owe), the detail page (facts, relationships,
  contracts, invoices, timeline), create and edit forms in the house style.
- Seed: the demo set (HC-008) and the production operator script's three organisations plus
  Bruntsfield Capital Limited itself as the issuer entity.

## Out of scope

- People beyond the counterparty contacts already on the record (HC-011). Any read from grassmarket
  or fountainbridge (HC-031, HC-032 add rows to the timeline). Merging duplicates (a follow-up once
  there are duplicates).

## Acceptance criteria

- [ ] OpenBB, Brandfetch and The Reset each render as one organisation with type, countries, pillar
      flags, the right contracts attached, and a timeline in date order.
- [ ] A relationship "OpenBB partners_with Bruntsfield" renders on both ends.
- [ ] Search finds "Brand" and "OpenBB, Inc." and "Reset".
- [ ] A `staff` principal with pillar `foundry` sees The Reset and not OpenBB; the URL for OpenBB is
      404 to them.
- [ ] List and detail at both sizes, heights recorded in `docs/design-conformance.md`.

## Verification

`/review` + `/qa`. Scoping tests in `lib/data/__tests__/organisations.test.ts`.
