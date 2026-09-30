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

export type Kind = 'renewal_rule';
/**
 * Where the contract presumes material contribution from any documented contact within N months before renewal, N goes here. Absent means it must be argued.
 */
export type MaterialContributionPresumedMonths = number | null;
export type NoticeDays = number | null;
/**
 * True where a renewal we materially contributed to restarts the window at year-one rates rather than continuing at year two.
 */
export type RestartsAtYearOne = boolean;

/**
 * What happens when the counterparty's own customer renews.
 */
export interface RenewalRule {
  kind?: Kind;
  material_contribution_presumed_months?: MaterialContributionPresumedMonths;
  notice_days?: NoticeDays;
  restarts_at_year_one: RestartsAtYearOne;
}
