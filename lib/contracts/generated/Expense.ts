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
 * An expense is proposed against a cost centre and confirmed by a person, never assumed.
 */
export type ExpenseAllocation = 'proposed' | 'confirmed';
/**
 * Amount in integer minor units (e.g. cents). Never a float: a float cannot hold 0.1 exactly, and a commission recomputed on one drifts every time.
 */
export type AmountMinor = number;
export type Currency = 'GBP' | 'USD' | 'EUR' | 'CHF' | 'HKD';
/**
 * Where this amount was read from, precisely enough for somebody to check it against the document: a contract clause, an invoice number, a statement line. Mandatory, for the same reason Money's assumption reference is: an amount with no provenance is a claim, and this record exists to hold facts.
 */
export type SourceRef = string;
export type BankActivityRef = string | null;
export type Category = string | null;
/**
 * Absent until somebody confirms where it belongs.
 */
export type CostCentreId = string | null;
/**
 * Redacted at intake. Never a full account reference.
 */
export type Counterparty = string | null;
export type Id = string;
export type IncurredOn = string;

/**
 * Money out, allocated to a pillar.
 *
 * `counterparty` is stored REDACTED. Bank narratives cross the untrusted-content boundary and
 * carry account references; what a profit and loss needs is who it was and what it cost, not the
 * last four digits of anybody's card.
 */
export interface Expense {
  allocation?: ExpenseAllocation;
  amount: RecordedAmount;
  bank_activity_ref?: BankActivityRef;
  category?: Category;
  cost_centre_id?: CostCentreId;
  counterparty?: Counterparty;
  id: Id;
  incurred_on: IncurredOn;
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
