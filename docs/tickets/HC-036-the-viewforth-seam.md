# HC-036 — The Viewforth seam: what a client will be allowed to see, as data

**Status:** Todo · **Phase:** 2 · **Depends on:** HC-012, HC-031 · **Repo:** holy-corner ·
**Branch:** `hc-036-the-viewforth-seam` · One ticket = one branch = one PR.

## Why this matters (for John)

Viewforth, the client portal, is phase three and not started. Grassmarket already decides what is
client-usable (gated deliverables, the value bridge, de-identified scoring runs) and shares reports
by tokenised link. Holy Corner is where a client organisation's record lives. This ticket does the
smallest thing that stops Viewforth from needing a rewrite here later: it records, per client
organisation, what they are entitled to see and from where.

## Context

- grassmarket `phase-2-seams.md` "What Viewforth reads": client-usable deliverables
  (`client_usable=True`, GRS-0015), the three-layer value bridge output, de-identified immutable
  scoring runs, never a draft pack (GRS-0033's gate). `ClientReportLink` and `/r/[token]` exist.
- The PRD's Viewforth: Platform Power Profile, deliverables, engagement status, recommendations,
  quarterly reports for retainer clients.
- HC-010's organisations, HC-012's contracts (a retainer term would define what a client gets).

## Scope

- Migration: `client_entitlements` (organisation_id, source ∈ grassmarket_deliverable /
  grassmarket_report_link / holy_corner_document, external_id, granted_by, granted_at,
  revoked_at?) and a `client_contacts` view over people of kind `client_contact`.
- On an organisation page: a "What this client can see" section listing entitlements with their
  source and a link to the grassmarket report link where one exists; grant and revoke as audited
  actions.
- `docs/viewforth-seam.md`: the API Viewforth will call (`GET /api/clients/me/entitlements`, the
  claim it will carry from HC-035), written but not built beyond the read.

## Out of scope

- Any client-facing screen. Anything Viewforth would render.

## Acceptance criteria

- [ ] For a demo client organisation, two entitlements (a report link and a document) render with
      source and grantor; revoking one records the event and hides it.
- [ ] The read endpoint returns only entitlements for the calling client's organisation and 404 for
      any other (tested).

## Verification

`/review` + `/qa`.
