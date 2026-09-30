-- HC-004 — the first migration: who people are, what role they hold, and what happened.
--
-- Three tables and no domain data. Organisations, contracts, invoices and money arrive in Phase 1,
-- each in its own ticket with its own migration. This one lays the ground they all stand on.
--
-- CONVENTIONS THIS FILE SETS, and every later migration follows:
--
--   * Money is TWO columns, always: `<name>_minor BIGINT` and `<name>_currency CHAR(3)`. Never a
--     NUMERIC, never a float, never an amount without its currency beside it (plan D5). No money
--     column appears here, but the rule is written down before the first one does.
--   * Dates are `date`; moments are `timestamptz`. NEVER text. Elite Vault stored ISO strings in
--     TEXT columns and every comparison became a string comparison that happened to work.
--   * Every table has `created_at timestamptz NOT NULL DEFAULT now()`.
--   * Identifiers are `text` primary keys holding a slug or a uuid, not bigserial. The record is
--     shared with two other systems, and a number that means something different in each of them
--     is worse than a longer key.

CREATE TABLE IF NOT EXISTS people (
  id            text PRIMARY KEY,
  -- The address this person is known by. Lower-cased at write time by the repository, so a lookup
  -- never has to guess about casing.
  email         text NOT NULL UNIQUE,
  display_name  text NOT NULL,
  -- The role the application resolves them to. Mirrors lib/authz.ts. Constrained rather than free
  -- text: a typo here is somebody silently holding no role.
  role          text NOT NULL CHECK (role IN ('admin', 'exec', 'finance', 'staff')),
  -- The pillars a staff or pillar-scoped principal is confined to. An EMPTY array means none, not
  -- all; lib/authz.ts reads it the same way, and the safe reading of an unset scope is the empty
  -- one.
  pillars       text[] NOT NULL DEFAULT '{}',
  -- Every address that is this same person. John has two, one of them off the Workspace domain,
  -- and "who is this" must not depend on which he signed in with.
  identities    text[] NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS people_role_idx ON people (role);

-- Role changes are HISTORY, not an update in place.
--
-- "Who gave this person access to the group's money, and when" is a question that gets asked once,
-- after something has gone wrong, and an UPDATE on people.role destroys the answer before anybody
-- thinks to ask. Append-only: the current role is the newest row, and people.role is the projection
-- of it that the application reads on the hot path.
CREATE TABLE IF NOT EXISTS role_assignments (
  id            bigserial PRIMARY KEY,
  person_id     text NOT NULL REFERENCES people (id) ON DELETE CASCADE,
  role          text NOT NULL CHECK (role IN ('admin', 'exec', 'finance', 'staff')),
  pillars       text[] NOT NULL DEFAULT '{}',
  -- Who made the change. Not nullable: a role that assigned itself is the thing this table exists
  -- to make impossible to claim.
  assigned_by   text NOT NULL,
  reason        text,
  assigned_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS role_assignments_person_idx ON role_assignments (person_id, assigned_at DESC);

-- What happened. Elite Vault had this table and never wrote to it; this one is written from day one.
CREATE TABLE IF NOT EXISTS activity_log (
  id            bigserial PRIMARY KEY,
  actor         text NOT NULL,
  action        text NOT NULL,
  entity_type   text NOT NULL,
  entity_id     text NOT NULL,
  at            timestamptz NOT NULL DEFAULT now(),
  details       jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS activity_log_at_idx ON activity_log (at DESC);
CREATE INDEX IF NOT EXISTS activity_log_entity_idx ON activity_log (entity_type, entity_id, at DESC);
