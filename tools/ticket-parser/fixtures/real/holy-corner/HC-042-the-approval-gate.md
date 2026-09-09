# HC-042 — The approval gate: proposed, granted, executed, on a signed event log

**Status:** Todo · **Phase:** 1/3 (built early; every proposal in Phase 1 uses it) ·
**Depends on:** HC-004, HC-005 · **Repo:** holy-corner · **Branch:** `hc-042-the-approval-gate` ·
One ticket = one branch = one PR.

## Why this matters (for John)

Nothing external — an invoice sent, a reminder emailed, a payment recorded, a studio told a client
paid — happens without a person saying yes, and the yes is a record nobody can forge or lose.
Fountainbridge built this as an append-only, HMAC-signed event log projected to a status, learned
that an audit trail the audited party can write is worse than none, and is now moving it from git
refs to a real event store (FB-171). Holy Corner starts on the event store.

## Context

- fountainbridge `lib/activegraph.ts`: `ActiveGraphEvent { v:1, seq, venture, repo, id, type ∈
  approval.proposed | approval.granted | approval.rejected | action.executing | action.executed |
  action.failed, at, actor {kind ∈ human | agent | executor, id}, data, attestation }`; ordering by
  `seq` never by clock; `canonicalEvent()` in a fixed field order; only a `human` may grant.
  `lib/activegraph-log.ts`: HMAC-SHA256 over the canonical form under `FOUNDRY_APPROVAL_SECRET`,
  `timingSafeEqual`, unverifiable events refused and counted as `refused`, surfaced. Two separate
  HMAC formulas for a grant attestation and an event; do not merge them. Learnings in
  `~/.gstack/projects/wealthcx01-fountainbridge/learnings.jsonl`: reconcile two stores to the
  furthest-advanced record; a self-declared actor is not authorisation; a storage-order fault must
  not block a user action.
- grassmarket ADR-0009: a minimal in-repo proposal/approval model now, ActiveGraph adapter later;
  `founder_approvals` bound to a content hash so a stale approval never counts.
- `ApprovalEvent` type added to bcap-contracts in HC-005.
- The "executor": the only code path that performs an external action, and it performs it only
  after reading a granted event whose attestation verifies and whose content hash matches the
  proposal.

## Scope

- Migration: `approval_events` (append-only: `seq` bigserial, scope, id, type, at, actor_kind,
  actor_id, data jsonb, content_hash, attestation), a `proposals` projection table maintained by
  a trigger or by the writer (status, proposed_at, decided_at, decided_by, executed_at), and a
  database rule refusing UPDATE and DELETE on `approval_events`.
- `lib/approvals/`: `propose(kind, subject, payload, actor)` → event; `grant(id, human)` /
  `reject(id, human)` with the attestation; `execute(id, executor)` that verifies then runs the
  registered executor for the kind and records executing → executed | failed; `project(id)` from
  the events; `narrate(event)` for the reader.
- The secret `HC_APPROVAL_SECRET` server-only; `scripts/sign-approval-fixtures.mjs` so e2e fixtures
  are signed like the real thing.
- Kinds registered by their tickets: contract terms accepted (HC-013), payment recorded (HC-014),
  payment matched (HC-015), expense allocated (HC-020), client-paid told to grassmarket (HC-018),
  document sent (HC-019), reminder sent (HC-044), inbox proposals (HC-040).
- `docs/adr/ADR-0002-the-approval-event-log.md`.
- The trail rendered on any subject that has one (FB-130's "every step here is the record your
  studio wrote as it happened"), including refused events as refused.

## Out of scope

- Replaying into a graph runtime (FB-171's ActiveGraph proper). Cross-system federation of events
  (HC-034 reads; it does not merge logs).

## Acceptance criteria

- [ ] An executor called without a granted, verifying event refuses and records nothing external
      (the load-bearing test).
- [ ] A grant from an actor of kind `agent` or `executor` is refused.
- [ ] Editing an event row in the database is refused by the rule; an event whose attestation
      fails is not counted and the refused count is visible on the trail.
- [ ] A proposal whose payload changed after the grant (content hash mismatch) cannot execute.
- [ ] Replaying all events reproduces every proposal's projected status exactly (a test).

## Verification

`/review` with security and red-team specialists on. `/qa` on the trail rendering at both sizes.
