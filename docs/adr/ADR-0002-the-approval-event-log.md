# ADR-0002 — The approval gate is an append-only, signed event log in Postgres, from the first external action

- **Status:** Accepted (2026-09-30). Directed by the plan's D7; ratified by HC-042.
- **Deciders:** Founder (John Gallagher), Engineering (the Holy Corner lane).
- **Normative source:** plan D7, CLAUDE.md #2 and #5.

## Context

Holy Corner will send invoices, email reminders, record payments, and tell the Advisory Studio that
a client has paid. Each of those reaches outside the building and cannot be taken back. CLAUDE.md #2
makes the gate on external actions the one absolute rule in this repository: nothing external
happens without a recorded human approval.

The Foundry Studio has been running this rule since FB-012 and implements it as JSON events written
to git refs. It works, it is auditable, and FB-171 is the ticket to move it onto a real event store.
Two things it learned are the reason this ADR exists rather than a paragraph in a ticket:

- **An audit trail the audited party can write is worse than no audit trail**, because it is
  believed. FB-051 added signing for exactly this.
- **A trail that silently drops what it cannot read is worse still**, because it looks complete.

Holy Corner starts where fountainbridge is heading. There is no git-refs stage to migrate off, and
the database already exists (HC-004).

The alternatives considered and not taken:

- **A `status` column on each subject.** Simplest, and it answers "is this approved" while destroying
  "who approved it, when, and was it the same thing that got done". That second question is the
  whole point.
- **The ActiveGraph runtime itself** (FB-171's direction). It has replay, forking and edge
  behaviours we would eventually want. It is also a Python service to run, and adopting a runtime
  before there is a single approval to record is scope this phase does not have. The event SHAPE is
  the same, so adopting it later is a reader change rather than a rewrite.
- **Signing with asymmetric keys.** Right when several systems must verify without being able to
  sign. Today one service writes and reads its own log, so an HMAC is the same guarantee with less
  key management. HC-035 is where this gets revisited, because that is when grassmarket starts
  verifying things Holy Corner signs.

## Decision

1. **The log is append-only, and the DATABASE enforces it.** `approval_events` carries rules that
   discard `UPDATE` and `DELETE`. A rule in application code is one the next feature can forget,
   and this is the table whose entire purpose is that nobody can quietly change what it says —
   including us. A decision that changed is a new event; the old one still happened.

2. **Order is `seq`, never the clock.** `seq` comes from a Postgres sequence, is part of what gets
   signed, and is taken before the row is written. Two events a millisecond apart have an unarguable
   order by integer and an arguable one by timestamp, and a timestamp is something a badly
   configured container can move. `at` is for a reader.

3. **Only a human grants or rejects.** Enforced twice: the contract's own validator refuses a
   decision by an actor of kind `agent` or `executor`, and `grant`/`reject` take a `Principal`,
   which only exists for a signed-in person. An agent that can grant its own proposal is the gate
   removed, and a self-declared actor is not authorisation.

4. **Every event carries an HMAC over its canonical form, and an event that does not verify is
   REFUSED AND COUNTED.** The count is shown on the trail. A proposal holding an unverifiable
   decision reads `unverified`, not `proposed`: "somebody tried to write a yes we cannot vouch for"
   and "nobody has decided yet" are different facts and must never look the same.

5. **The canonical form is a fixed field order, and payloads are key-sorted at every depth.** Not
   `JSON.stringify(event)`. A `jsonb` column does not return keys in the order they went in, so an
   attestation computed over an incidental ordering verifies on the machine that wrote it and
   nowhere else — which presents as "the audit log is corrupt" rather than as a serialisation bug.

6. **A grant is bound to the hash of what it approved, and the grant attestation is a SEPARATE
   FORMULA from the event attestation.** Without the binding, "approve this payment of five hundred"
   can become five thousand between the yes and the doing and the log still reads clean. Without the
   domain separation, an event of one type could be replayed as a grant because the signature would
   still verify over a string that no longer says what it used to. Fountainbridge's own header says
   do not merge the two formulas; this does not merge them.

7. **`execute` is the only code path that performs an external action**, and it refuses on any of:
   the proposal is not granted; no granted event verifies; the grant's own attestation does not
   verify for this proposal, hash and person; the log holds more than one proposal event; the
   payload's hash no longer matches. Each refusal writes nothing.

8. **A failure is recorded, not swallowed.** `action.failed` carries the reason. A gate that goes
   quiet on failure cannot be told from one that never fired, and the difference matters when
   somebody asks whether the invoice went out.

9. **The `proposals` table is a projection and the log is the truth.** A test replays every log and
   asserts it reproduces the table. If the two ever disagree, the log wins.

10. **Unchanged:** the event shape is the Foundry Studio's, field for field, so the two logs are one
    type and HC-033's queue can read both. Git stays authoritative for the Foundry Studio's own
    work items; this log is not a competing store for anything either studio owns.

## Consequences

**Accepted: the secret is a single point of failure for verification.** `HC_APPROVAL_SECRET` signs
everything. Lose it and no historical event verifies; leak it and a convincing forgery becomes
possible. Mitigated by keeping it only in the Railway environment, never in the repository, and by
the direction of failure: unset, the gate refuses everything rather than accepting everything.

**Accepted: rotating the secret invalidates every historical attestation.** There is no rotation
plan in this ticket, deliberately, because designing one before a single real approval exists would
be guessing. It needs an ADR of its own and a re-signing pass, and this paragraph is the note that
says so rather than leaving it to be discovered.

**Accepted: append-only means mistakes are permanent.** A proposal written with the wrong payload
cannot be tidied away; it is rejected and a new one is proposed. That is the correct behaviour and
it will, at some point, be annoying.

**Accepted: this is not ActiveGraph.** No replay into a graph runtime, no fork-and-diff, no
edge-behaviours. FB-171 wants those. The event shape is compatible, so the day they are worth
having, adopting them reads the same events.

**Consequence: the executor registry is the list of things that can reach outside.** Anything not in
it cannot be executed, and a proposal whose kind is unregistered refuses rather than reporting
success. That makes the registry a short, readable inventory of every external action this product
can take, which is worth having for its own sake.
