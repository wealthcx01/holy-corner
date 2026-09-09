# Architecture decision records

One ADR per decision. ADRs are immutable once Accepted; a change is a new ADR that supersedes the
old one, never a silent edit (the grassmarket rule). Where an ADR and `docs/holy-corner-plan.md`
disagree, the plan wins and the ADR is a defect until amended by PR.

Format, copied from grassmarket ADR-0041:

```markdown
# ADR-nnnn — <the decision, as a sentence>

- **Status:** Accepted (YYYY-MM-DD). <who directed it, which ticket ratifies it>
- **Deciders:** Founder (…), Engineering (…).
- **Normative source:** plan Dn, CLAUDE.md #n

## Context
## Decision   (numbered, each a bolded imperative; include an explicit "Unchanged:" clause)
## Consequences   (accepted risks named as accepted)
```

| ADR | Decision | Status | Ticket |
|---|---|---|---|
| ADR-0001 | How Holy Corner calls Claude: SDK, models, env names, provenance recorded on every output | to be written | HC-013 |
| ADR-0002 | The approval event log: shape, signing, storage, projection | to be written | HC-042 |
| ADR-0003 | How Wise is read, and why it is never written | to be written | HC-015 (after SD3-0108) |
