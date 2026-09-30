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

export type Description = string;
export type Kind = 'milestone';
/**
 * What is measured, e.g. 'net_revenue_per_month'.
 */
export type Measure = string;
/**
 * How many consecutive periods the threshold must hold. A revenue figure hit once is not the same as one sustained, and the contract says which.
 */
export type SustainedMonths = number | null;
/**
 * Amount in integer minor units (e.g. cents). Never a float: a float cannot hold 0.1 exactly, and a commission recomputed on one drifts every time.
 */
export type AmountMinor = number;
export type Currency = 'GBP' | 'USD' | 'EUR' | 'CHF' | 'HKD';
/**
 * Where this amount was read from, precisely enough for somebody to check it against the document: a contract clause, an invoice number, a statement line. Mandatory, for the same reason Money's assumption reference is: an amount with no provenance is a claim, and this record exists to hold facts.
 */
export type SourceRef = string;

/**
 * A thing that has to be true, not a payment.
 *
 * A Foundry venture earns nothing and is measured by whether it can support its founder. The
 * threshold is a `RecordedAmount` when the measure is money and absent when it is not.
 */
export interface Milestone {
  description: Description;
  kind?: Kind;
  measure: Measure;
  sustained_months?: SustainedMonths;
  threshold?: RecordedAmount | null;
}
/**
 * An amount that is a FACT on a document, not a figure under assumptions (HC-005).
 *
 * ``Money`` above cannot be constructed without an ``assumption_register_ref``, and that is
 * correct for what it is for: a lever NPV or a remediation cost is only meaningful under stated
 * assumptions, and ADR-0002 exists because the prototype subtracted pounds from score-points.
 *
 * Holy Corner needs the other kind. ``USD 5,000`` on invoice INV-001 is not modelled, not
 * uncertain and not an assumption. It is written on a document somebody signed. Putting it in a
 * field named ``assumption_register_ref`` would say the opposite of what is true, and a field used
 * against its own name is how a wrong number survives review: the next reader believes the name.
 *
 * So the two types are distinguished by WHERE THE NUMBER CAME FROM, which is the thing that
 * actually differs:
 *
 * * ``Money`` cites the assumptions that justify a modelled figure.
 * * ``RecordedAmount`` cites the source it was read from - a contract clause, an invoice, a
 *   partner's cash report, a bank statement line.
 *
 * Both are integer minor units with an explicit currency, and neither can exist without
 * provenance. Neither converts to the other, and this package defines no function that takes one
 * and returns the other: a modelled figure and an observed one are not interchangeable just
 * because both are denominated in pounds.
 */
export interface RecordedAmount {
  amount_minor: AmountMinor;
  currency: Currency;
  source_ref: SourceRef;
}
