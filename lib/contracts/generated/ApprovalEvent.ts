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
/**
 * When, for a reader. Not the ordering (see `seq`).
 */
export type At = string;
/**
 * HMAC over the event's canonical form. Absent only on an event that has not been signed yet; a stored event without one does not verify and is refused.
 */
export type Attestation = string | null;
/**
 * A hash of the proposal's payload. Carried on the proposal and on the grant, so an executor can prove the thing approved is the thing it is about to do.
 */
export type ContentHash = string | null;
/**
 * The proposal this event concerns. Stable across its life.
 */
export type Id1 = string;
/**
 * Which log this belongs to. The Foundry Studio scopes by venture; Holy Corner scopes by the subject the approval is about.
 */
export type Scope = string;
/**
 * Monotonic within a scope. THE ORDER OF THE LOG. Never sort these by `at`: two events a millisecond apart have an unarguable order by integer and an arguable one by clock.
 */
export type Seq = number;
/**
 * The whole lifecycle. A proposal ends granted-then-executed, rejected, or failed.
 */
export type ApprovalEventType =
  | 'approval.proposed'
  | 'approval.granted'
  | 'approval.rejected'
  | 'action.executing'
  | 'action.executed'
  | 'action.failed';
/**
 * Shape version, so a reader can tell old from new.
 */
export type V = number;

/**
 * One event in the log. Immutable by construction: `frozen=True`.
 */
export interface ApprovalEvent {
  actor: Actor;
  at: At;
  attestation?: Attestation;
  content_hash?: ContentHash;
  data?: Data;
  id: Id1;
  scope: Scope;
  seq: Seq;
  type: ApprovalEventType;
  v?: V;
}
export interface Actor {
  id: Id;
  kind: ActorKind;
}
/**
 * What this event is about, in the kind's own terms.
 */
export interface Data {
  [k: string]: unknown;
}
