/* eslint-disable */
/**
 * GENERATED FILE. DO NOT EDIT.
 *
 * Produced by `node scripts/generate-types.mjs` from the JSON Schemas vendored in `schema/`,
 * which come from `packages/bcap_contracts` in the grassmarket repository.
 *
 *   package version : 0.3.0
 *   source commit   : 7f75646b2632e622a6760bf06f56b91402e57602
 *
 * A change to any of these shapes is made in that package and re-vendored, never here. Editing
 * this file turns the "Contracts parity" check red on the next run, which is what it is for
 * (CLAUDE.md #6: do not hand-author a parallel type).
 */

export type ContentHash = string | null;
export type DecidedAt = string | null;
/**
 * Who, precisely enough to ask them about it later: a person's email, an agent's name, the executor's identifier.
 */
export type Id = string;
/**
 * Who did this.
 *
 * The distinction is load-bearing and is the reason this is an enum rather than a string. Only a
 * `HUMAN` may grant. An `AGENT` proposes; an `EXECUTOR` is the one code path that performs an
 * external action, and it acts only on a grant it has verified.
 */
export type ActorKind = 'human' | 'agent' | 'executor';
export type ExecutedAt = string | null;
export type Id1 = string;
/**
 * What is being proposed, e.g. 'invoice.send' or 'payment.record'. The executor registry keys off this.
 */
export type Kind = string;
export type ProposedAt = string;
/**
 * How many events in this proposal's log failed to verify. Shown, not hidden.
 */
export type RefusedEvents = number;
export type Scope = string;
/**
 * The projection of a log, for a screen. Derived, never stored as the truth.
 */
export type ProposalStatus =
  'proposed' | 'granted' | 'rejected' | 'executing' | 'executed' | 'failed' | 'unverified';
/**
 * What it is about, e.g. an invoice number.
 */
export type Subject = string;

/**
 * What a screen shows: one proposal, its state, and who decided it.
 */
export interface Proposal {
  content_hash?: ContentHash;
  decided_at?: DecidedAt;
  decided_by?: Actor | null;
  executed_at?: ExecutedAt;
  id: Id1;
  kind: Kind;
  proposed_at: ProposedAt;
  proposed_by: Actor;
  refused_events?: RefusedEvents;
  scope: Scope;
  status: ProposalStatus;
  subject: Subject;
}
export interface Actor {
  id: Id;
  kind: ActorKind;
}
