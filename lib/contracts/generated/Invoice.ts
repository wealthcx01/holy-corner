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

export type BilledToOrganisationId = string;
export type ContractId = string | null;
export type ContractTermRef = string | null;
export type Currency = 'GBP' | 'USD' | 'EUR' | 'CHF' | 'HKD';
export type DueOn = string | null;
/**
 * The id in whatever system issued it, e.g. a Wise invoice id.
 */
export type ExternalRef = string | null;
export type Id = string;
export type IssuedOn = string | null;
/**
 * The Bruntsfield entity billing.
 */
export type IssuerOrganisationId = string;
/**
 * The term this line is charging for, where there is one.
 */
export type ContractTermRef1 = string | null;
export type Description = string;
export type Quantity = number;
/**
 * Amount in integer minor units (e.g. cents). Never a float: a float cannot hold 0.1 exactly, and a commission recomputed on one drifts every time.
 */
export type AmountMinor = number;
/**
 * Where this amount was read from, precisely enough for somebody to check it against the document: a contract clause, an invoice number, a statement line. Mandatory, for the same reason Money's assumption reference is: an amount with no provenance is a claim, and this record exists to hold facts.
 */
export type SourceRef = string;
export type Lines = InvoiceLine[];
/**
 * The human number, e.g. 'INV-001'.
 */
export type Number = string;
/**
 * Forward only, like the Advisory Studio's payment status. No skips and no reversals.
 *
 * `overdue` is deliberately NOT here. It is derived from the due date and the status every
 * time it is asked for, because a stored "overdue" is a fact that was true when a job last ran.
 */
export type InvoiceStatus =
  'draft' | 'issued' | 'sent' | 'part_paid' | 'paid' | 'written_off' | 'void';

/**
 * What we billed, to whom, for what, and whether it has been paid.
 */
export interface Invoice {
  billed_to_organisation_id: BilledToOrganisationId;
  contract_id?: ContractId;
  contract_term_ref?: ContractTermRef;
  currency: Currency;
  due_on?: DueOn;
  external_ref?: ExternalRef;
  id: Id;
  issued_on?: IssuedOn;
  issuer_organisation_id: IssuerOrganisationId;
  lines?: Lines;
  number: Number;
  status?: InvoiceStatus;
  tax_total?: RecordedAmount | null;
  total: RecordedAmount;
}
export interface InvoiceLine {
  contract_term_ref?: ContractTermRef1;
  description: Description;
  quantity?: Quantity;
  tax_amount?: RecordedAmount | null;
  unit_amount: RecordedAmount;
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
