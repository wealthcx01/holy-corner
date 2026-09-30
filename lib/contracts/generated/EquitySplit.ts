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
 * Basis points of the fully diluted total.
 */
export type Bps = number;
export type CliffMonths = number | null;
/**
 * 'founder', 'bruntsfield', 'option_pool'.
 */
export type Holder = string;
export type Kind = 'equity_split';
/**
 * True where the signed document carries this figure in square brackets.
 */
export type Provisional = boolean;
export type VestingMonths = number | null;

/**
 * Who holds what at spin-out, in basis points.
 *
 * `provisional` exists because the signed document has the figures in square brackets. Recording a
 * bracketed placeholder as though it were agreed is how a negotiating position becomes a fact
 * nobody remembers agreeing to.
 */
export interface EquitySplit {
  bps: Bps;
  cliff_months?: CliffMonths;
  holder: Holder;
  kind?: Kind;
  provisional?: Provisional;
  vesting_months?: VestingMonths;
}
