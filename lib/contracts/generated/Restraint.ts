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

export type CarveOut = string | null;
export type Kind = 'restraint';
export type Months = number;
export type Provisional = boolean;
/**
 * 'non_compete' or 'non_solicit'.
 */
export type RestraintType = string;

/**
 * A non-compete or non-solicit, with its carve-outs.
 */
export interface Restraint {
  carve_out?: CarveOut;
  kind?: Kind;
  months: Months;
  provisional?: Provisional;
  restraint_type: RestraintType;
}
