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
 * Amount in integer minor units (e.g. pence).
 */
export type AmountMinor = number;
/**
 * Reference to the assumption-register entry that justifies this figure. Mandatory: currency claims are never made without stated assumptions (Methodology §10).
 */
export type AssumptionRegisterRef = string;
export type Currency = 'GBP' | 'USD' | 'EUR' | 'CHF' | 'HKD';

/**
 * A currency amount that cannot exist without an explicit currency and a reference to the
 * assumption register that justifies it (Methodology §10, ADR-0002 compliance test).
 *
 * A lever NPV or remediation cost is only meaningful under stated assumptions; a `Money`
 * without an ``assumption_register_ref`` is not constructible.
 */
export interface Money {
  amount_minor: AmountMinor;
  assumption_register_ref: AssumptionRegisterRef;
  currency: Currency;
}
