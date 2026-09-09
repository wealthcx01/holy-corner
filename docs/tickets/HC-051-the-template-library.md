# HC-051 — The template library: every agreement we sign, versioned, with variables

**Status:** Todo · **Phase:** 4 · **Depends on:** HC-019 · **Repo:** holy-corner ·
**Branch:** `hc-051-the-template-library` · One ticket = one branch = one PR.

## Why this matters (for John)

OpenBB's MSA went through six versions and Brandfetch's through four before signature, each a
`.docx` edited by hand, and the Proposals folder already has a PowerShell script that assembles a
contract from parts. HC-019 proved one MSA and one schedule from a template. This ticket makes the
whole set a library: MSA, Engagement Schedule, Consultant Agreement (v7), Foundry Collaboration &
Incubation Agreement, Binding Forward Term Sheet, Service & Engagement Schedule, Founders Service
Agreement — versioned in git, with the variables named, and generated from a contract record.

## Context

- Sources in OneDrive: `Proposals/OpenBB/OpenBB_BC_MSA_v6.docx`, `Proposals/Brandfetch/…v4`,
  `Proposals/Brandfetch/Build-V3-Contracts.ps1` and `msa_v3.verify.xml`,
  `Resources/Bruntsfield_Consultant_Agreement_TEMPLATE_v7.docx`, `Co-Founder-Pack/Templates/*`.
- HC-012's terms are the variables; a template declares which term kinds it requires, and
  generation refuses if one is missing (fail loud).
- grassmarket's rule for normative documents: a change is a new version, never a silent edit.

## Scope

- `content/templates/<type>/v<N>.md` with a declared variable list and required term kinds;
  `lib/templates.ts` to load, validate a contract against a template, and render (HC-019's
  renderer).
- Screens under **The record → Templates**: list, read, "start a contract from this template"
  (creates a draft contract with empty required terms), diff between versions.
- Each existing signed contract linked to the template version it was made from (or "pre-library").
- Jurisdiction variants as variables, not forks (New York, Switzerland, Hong Kong governing-law
  clauses as blocks).

## Out of scope

- Legal review of the templates (John and counsel; the library holds what they approve).
  E-signature.

## Acceptance criteria

- [ ] Starting an MSA + schedule for a demo partner from the library and filling the terms renders
      a document whose clauses match the OpenBB v6 structure section for section (checked by eye
      and by a structural test on headings).
- [ ] Generation with a missing required term refuses with the term named.
- [ ] A template edit creates v(N+1); v(N) still renders identically (a golden test).

## Verification

`/review` + `/qa`. Rendered documents attached to the PR.
