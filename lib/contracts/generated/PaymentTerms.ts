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

export type Currency = 'GBP' | 'USD' | 'EUR' | 'CHF' | 'HKD';
export type Days = number;
export type Kind = 'payment_terms';
/**
 * e.g. 'electronic_transfer'.
 */
export type Method = string | null;

/**
 * How long the counterparty has to pay, and in what.
 */
export interface PaymentTerms {
  currency: Currency;
  days: Days;
  kind?: Kind;
  method?: Method;
}
