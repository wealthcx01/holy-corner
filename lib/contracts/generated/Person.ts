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
 * Every address that is this same person, lower-cased.
 */
export type Emails = string[];
export type Id = string;
/**
 * What this person is to Bruntsfield. One person can only be one of these at a time here.
 */
export type PersonKind = 'staff' | 'consultant' | 'founder' | 'client_contact' | 'cohort';
export type Name = string;
/**
 * The organisation they belong to, where they belong to one.
 */
export type OrganisationId = string | null;
export type Title = string | null;

/**
 * One person, with every address that is them.
 *
 * `emails` is a tuple and not a single field because one person genuinely has several: the
 * Managing Partner signs contracts from one address and is an administrator under another, and
 * "who is this" must not depend on which one they happened to use.
 */
export interface Person {
  emails?: Emails;
  id: Id;
  kind: PersonKind;
  name: Name;
  organisation_id?: OrganisationId;
  title?: Title;
}
