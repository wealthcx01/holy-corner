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
 * Which kind of deal this rate applies to, in the contract's own words, e.g. 'white_label_exchange' or 'distribution_direct_acv'.
 */
export type EngagementType = string;
export type Kind = 'commission_rate';
/**
 * How long commission runs from first cash received on the engagement.
 */
export type WindowMonths = number;
/**
 * Year-one rate in basis points. 3000 is 30%.
 */
export type Yr1Bps = number;
/**
 * Year-two rate. 0 where year two earns nothing.
 */
export type Yr2Bps = number;

/**
 * What we earn on a deal, in basis points, per contract year.
 *
 * BASIS POINTS AND NOT A PERCENTAGE FLOAT. The Advisory Studio's own commission config is already
 * in bps, the contracts are written in whole and half percents, and 7.5% is 750 - exact - where a
 * float is 0.075 and is not. A rate that arrives as an integer and stays one cannot drift.
 */
export interface CommissionRate {
  engagement_type: EngagementType;
  kind?: Kind;
  window_months: WindowMonths;
  yr1_bps: Yr1Bps;
  yr2_bps: Yr2Bps;
}
