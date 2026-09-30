-- HC-042 — the approval gate: an append-only, signed event log.
--
-- Nothing external happens without a person saying yes, and the yes is a record nobody can forge
-- or lose. Plan D7, CLAUDE.md #2 and #5.
--
-- The Foundry Studio built this as JSON files on git refs, learned that an audit trail the audited
-- party can write is worse than none, and is moving to a real event store (FB-171). Holy Corner
-- starts on the event store, with the same event shape, so the two logs are one type.

CREATE TABLE IF NOT EXISTS approval_events (
  -- THE ORDER OF THE LOG. Never sort these by `at`: two events a millisecond apart have an
  -- unarguable order by integer and an arguable one by clock, and the clock is the one an attacker
  -- or a badly configured container can move.
  seq           bigserial PRIMARY KEY,
  -- Which log this belongs to. The Foundry Studio scopes by venture; here it is the subject the
  -- approval is about, e.g. 'invoice:INV-001'.
  scope         text NOT NULL,
  -- The proposal. Stable across its whole life, from proposed to executed.
  proposal_id   text NOT NULL,
  type          text NOT NULL CHECK (type IN (
                  'approval.proposed', 'approval.granted', 'approval.rejected',
                  'action.executing', 'action.executed', 'action.failed')),
  at            timestamptz NOT NULL DEFAULT now(),
  actor_kind    text NOT NULL CHECK (actor_kind IN ('human', 'agent', 'executor')),
  actor_id      text NOT NULL,
  data          jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- A hash of the proposal's payload, carried on the proposal AND on the grant, so an executor can
  -- prove the thing approved is the thing it is about to do.
  content_hash  text,
  -- HMAC over the event's canonical form. An event that does not verify is refused and COUNTED.
  attestation   text
);

CREATE INDEX IF NOT EXISTS approval_events_proposal_idx ON approval_events (proposal_id, seq);
CREATE INDEX IF NOT EXISTS approval_events_scope_idx ON approval_events (scope, seq);

-- APPEND ONLY, ENFORCED BY THE DATABASE AND NOT BY THE APPLICATION.
--
-- A rule in the code is a rule the next feature can forget. This is the table whose whole purpose
-- is that nobody can quietly change what it says, including us: an audit trail the audited party
-- can edit is worse than no audit trail, because it is believed.
--
-- A decision that changed is a NEW EVENT. The old one still happened, and the log says so.
CREATE OR REPLACE RULE approval_events_no_update AS
  ON UPDATE TO approval_events DO INSTEAD NOTHING;

CREATE OR REPLACE RULE approval_events_no_delete AS
  ON DELETE TO approval_events DO INSTEAD NOTHING;

-- The projection. Derived from the events, never the truth, and rebuildable by replaying them.
--
-- It exists because a screen asking "what is waiting on me" should not replay every event in the
-- system to find out. A test asserts that replaying the log reproduces this table exactly; if the
-- two ever disagree, the log wins.
CREATE TABLE IF NOT EXISTS proposals (
  id            text PRIMARY KEY,
  scope         text NOT NULL,
  -- What is being proposed, e.g. 'invoice.send'. The executor registry keys off this.
  kind          text NOT NULL,
  subject       text NOT NULL,
  status        text NOT NULL CHECK (status IN (
                  'proposed', 'granted', 'rejected', 'executing', 'executed', 'failed',
                  'unverified')),
  proposed_at   timestamptz NOT NULL,
  proposed_by   text NOT NULL,
  decided_at    timestamptz,
  decided_by    text,
  executed_at   timestamptz,
  content_hash  text,
  -- How many events in this proposal's log failed to verify. Shown on the trail, never hidden.
  refused_events integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS proposals_status_idx ON proposals (status, proposed_at DESC);
CREATE INDEX IF NOT EXISTS proposals_scope_idx ON proposals (scope);
