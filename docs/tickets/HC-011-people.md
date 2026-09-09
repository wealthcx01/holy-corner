# HC-011 — People: staff, consultants and founders mirrored, client contacts held

**Status:** Todo · **Phase:** 1 · **Depends on:** HC-010 · **Repo:** holy-corner ·
**Branch:** `hc-011-people` · One ticket = one branch = one PR.

## Why this matters (for John)

Four kinds of people touch the group and today they live in four places: staff in the admin
allowlist, consultants in the Advisory Studio, founders in the Foundry Studio's venture manifests,
client contacts in contract PDFs and inboxes. Holy Corner is where one person is one record with
every identity and every role they hold, so "who is Ross" or "which of John's two addresses" is never
a question the system has to guess at.

## Context

- `people` from HC-004 (identities[] already there), `Person` from HC-005.
- grassmarket `Consultant` (tier, assessor_level, certification), read through its API with the
  admin identity (HC-031). fountainbridge `founder` per manifest (`name`, `github_login`,
  `workspace_email`), read via HC-032. Both are mirrors: the studio stays the source of truth for
  its own fields; Holy Corner holds the link and the group-level facts (organisation, kind, role here).
- The consultant agreements for Byoung and Randy (OneDrive `Resources/Consultants/`) are contracts
  whose counterparty is a person, not an organisation — the contract model (HC-012) needs a
  `counterparty_person_id` alternative.
- Elite Vault `contacts` (brand_id, role_title, email, phone).

## Scope

- Migration: `people` gains `kind`, `organisation_id?`, `title?`, `phone?`, `preferences jsonb`;
  `person_links` (system, external_id) like organisation links.
- Repository: `listPeople`, `getPerson`, `createPerson`, `mergeIdentities` (two records that are one
  person, audited), `peopleForOrganisation`.
- Screens under **The record → People**: list by kind, the person page (identities, organisation,
  roles here, contracts they are party to, links out to their studio profile), create and edit.
- The staff list doubles as the role-assignment screen for admins (assign `exec`, `finance`, `staff`
  + pillars; every change audited).
- Client contacts from the record: Didier Lopes (OpenBB), the Brandfetch signatory, Ross Cochrane
  (as founder, kind `founder`, organisation The Reset).

## Out of scope

- Reading the studios (HC-031, HC-032 populate the mirrors). Invitations into grassmarket (HC-031
  ports that admin action). Calendars, availability, communication history.

## Acceptance criteria

- [ ] John is one person with two identities, role `admin`; signing in with either address resolves
      to that record (a test through `lib/authz.ts`).
- [ ] Ross Cochrane is one person, kind `founder`, linked to The Reset, party to the Collaboration
      Agreement.
- [ ] An admin assigns `finance` to a staff person; the change appears in the activity log with
      both identities; the person's next request is scoped as `finance`.
- [ ] A `staff` principal cannot open the role-assignment screen (404).

## Verification

`/review` + `/qa`. Screens at both sizes with heights recorded.
