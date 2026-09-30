# HC-042 — The approval gate: proposed, granted, executed, on a signed event log

**Status:** Done · **Phase:** 1/3 (built early; every proposal in Phase 1 uses it) ·
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

- [x] An executor called without a granted, verifying event refuses and records nothing external.
      Four separate refusals, each with a test that asserts the executor did not run: not granted,
      rejected, a forged grant row, and an unregistered kind.
- [x] A grant from an actor of kind `agent` or `executor` is refused — **twice**. The contract's
      validator refuses the event, and `grant` takes a `Principal`, which only exists for a
      signed-in person, so there is no argument that could make it an agent.
- [x] Editing an event row is discarded by the database rule, proved by running an `UPDATE` and a
      `DELETE` and finding the row unchanged and still there. An event whose attestation fails is
      counted, and the proposal reads `unverified` rather than `proposed`.
- [x] A proposal whose payload changed after the grant cannot execute. **The criterion's own
      wording pointed at the wrong attack** — see below.
- [x] Replaying all events reproduces every proposal's projected status exactly.

## Verification

`/review` with security and red-team specialists on. `/qa` on the trail rendering at both sizes.


## What building it turned up

**The criterion about a changed payload described an attack the design already prevents, and missed
the one it did not.** "A proposal whose payload changed after the grant cannot execute" reads as
though somebody edits the payload. They cannot: the log is append-only and the database discards an
`UPDATE`.

What append-only does NOT stop is an `INSERT`. The real shape of the attack is appending a SECOND
`approval.proposed` event, with a larger amount, after the grant — and the first version of
`execute` read the payload with `events.find(...)`, which returns the first match, while `project`
read the last. Two functions disagreeing about which payload is the payload, on the one code path
that reaches outside the building.

`execute` now refuses outright when a log holds more than one proposal event. A proposal is proposed
once; two is either tampering or a bug, and neither goes out. The test that proves it appends the
second event and asserts the executor never ran.

**The obvious way to write a signed append-only row does not work.** Insert, read back the generated
`seq`, then update the row with its attestation — the append-only rule silently discards that
`UPDATE`, and the event sits in the log for ever with a null attestation, which reads as forged. The
sequence number is taken first with `nextval`, which is atomic, and the row is inserted once,
complete.

**Key order had to be pinned or nothing would verify.** A `jsonb` column does not return keys in the
order they went in, so an attestation over `JSON.stringify(event)` verifies on the machine that
wrote it and fails everywhere else. That presents as "the audit log is corrupt" rather than as a
serialisation bug, which is a bad afternoon. The canonical form is a fixed field order with payloads
key-sorted at every depth.

**A missing secret refuses everything rather than accepting everything.** Worth stating because the
opposite is the easy accident: with no secret, `verify` returns false, every event is counted as
refused, and every proposal reads `unverified`. There is a test for it, because the direction of
failure on a gate is the whole question.

## What is not here

**The trail is not rendered on a screen.** `narrate` turns an event into a sentence and is tested,
but no page shows it, because the subjects that will have trails — invoices, payments, contract
terms — arrive in Phase 1. HC-033 builds the queue and HC-014 the first subject with a trail worth
looking at. Building a screen for data that does not exist would mean inventing the data.

**No executor is registered.** The registry is empty on purpose: this ticket builds the gate, and
each Phase 1 ticket registers its own kind (HC-013 contract terms, HC-014 payment recorded, HC-015
payment matched, HC-018 client-paid, HC-019 document sent, HC-020 expense allocated). The registry
being empty means nothing can reach outside the building yet, which is the correct state for a
product with no record in it.
