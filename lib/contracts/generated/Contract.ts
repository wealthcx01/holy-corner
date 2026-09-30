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

export type CounterpartyOrganisationId = string | null;
/**
 * For the agreements whose counterparty is a person rather than a company: a consultant agreement, a founders service agreement.
 */
export type CounterpartyPersonId = string | null;
export type DatedOn = string | null;
/**
 * 'executed', 'draft', 'signed_counterparty' or 'countersigned'.
 */
export type DocumentKind = string;
/**
 * For refusing a duplicate upload.
 */
export type Md5 = string | null;
/**
 * Where the file lives. Never the file.
 */
export type StorageKey = string;
/**
 * The version on the document, e.g. 'v6'.
 */
export type Version = string;
export type Documents = ContractDocument[];
export type EffectiveOn = string | null;
/**
 * e.g. 'State of New York' or 'Switzerland'.
 */
export type GoverningLaw = string | null;
export type Id = string;
/**
 * The MSA a schedule belongs to.
 */
export type ParentContractId = string | null;
/**
 * A Bruntsfield vertical. Three are live or building; three are names with a plan.
 */
export type Pillar = 'advisory' | 'foundry' | 'clients' | 'briefing' | 'equity' | 'cohort';
export type SignedOn = string | null;
/**
 * Forward only. A contract does not go back to draft once it has been signed.
 */
export type ContractStatus = 'draft' | 'sent' | 'signed' | 'active' | 'expired' | 'terminated';
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
 * Amount in integer minor units (e.g. cents). Never a float: a float cannot hold 0.1 exactly, and a commission recomputed on one drifts every time.
 */
export type AmountMinor = number;
export type Currency = 'GBP' | 'USD' | 'EUR' | 'CHF' | 'HKD';
/**
 * Where this amount was read from, precisely enough for somebody to check it against the document: a contract clause, an invoice number, a statement line. Mandatory, for the same reason Money's assumption reference is: an amount with no provenance is a claim, and this record exists to hold facts.
 */
export type SourceRef = string;
/**
 * True when the payment draws down against commission as it accrues; false when it is kept and commission is earned on top of it.
 */
export type Creditable = boolean;
export type DueOnSignature = boolean;
export type Kind1 = 'commitment_payment';
export type Kind2 = 'renewal_rule';
/**
 * Where the contract presumes material contribution from any documented contact within N months before renewal, N goes here. Absent means it must be argued.
 */
export type MaterialContributionPresumedMonths = number | null;
export type NoticeDays = number | null;
/**
 * True where a renewal we materially contributed to restarts the window at year-one rates rather than continuing at year two.
 */
export type RestartsAtYearOne = boolean;
export type Kind3 = 'run_off_period';
export type Months = number;
export type Description = string;
export type Kind4 = 'milestone';
/**
 * What is measured, e.g. 'net_revenue_per_month'.
 */
export type Measure = string;
/**
 * How many consecutive periods the threshold must hold. A revenue figure hit once is not the same as one sustained, and the contract says which.
 */
export type SustainedMonths = number | null;
/**
 * Basis points of the fully diluted total.
 */
export type Bps = number;
export type CliffMonths = number | null;
/**
 * 'founder', 'bruntsfield', 'option_pool'.
 */
export type Holder = string;
export type Kind5 = 'equity_split';
/**
 * True where the signed document carries this figure in square brackets.
 */
export type Provisional = boolean;
export type VestingMonths = number | null;
export type Kind6 = 'long_stop';
export type Months1 = number;
export type Provisional1 = boolean;
/**
 * What the counterparty may require if the date passes.
 */
export type Remedy = string | null;
export type CarveOut = string | null;
export type Kind7 = 'restraint';
export type Months2 = number;
export type Provisional2 = boolean;
/**
 * 'non_compete' or 'non_solicit'.
 */
export type RestraintType = string;
export type Days = number;
export type Kind8 = 'payment_terms';
/**
 * e.g. 'electronic_transfer'.
 */
export type Method = string | null;
export type Terms = (
  | CommissionRate
  | CommitmentPayment
  | RenewalRule
  | RunOffPeriod
  | Milestone
  | EquitySplit
  | LongStop
  | Restraint
  | PaymentTerms
)[];
/**
 * The document kinds Bruntsfield actually signs. Every one of these exists on paper today.
 */
export type ContractType =
  | 'msa'
  | 'engagement_schedule'
  | 'collaboration_agreement'
  | 'term_sheet'
  | 'service_schedule'
  | 'consultant_agreement'
  | 'founders_service_agreement'
  | 'other';

/**
 * One signed (or unsigned) agreement.
 *
 * `dated_on` and `effective_on` are SEPARATE FIELDS AND BOTH ARE KEPT. One agreement in the record
 * has a Master Services Agreement dated one day and a schedule stating it was entered into five
 * weeks earlier. Collapsing them to a single date loses a discrepancy that is on the face of the
 * documents and that somebody has to decide about; keeping both makes it visible every time the
 * contract is read.
 */
export interface Contract {
  counterparty_organisation_id?: CounterpartyOrganisationId;
  counterparty_person_id?: CounterpartyPersonId;
  dated_on?: DatedOn;
  documents?: Documents;
  effective_on?: EffectiveOn;
  governing_law?: GoverningLaw;
  id: Id;
  parent_contract_id?: ParentContractId;
  pillar: Pillar;
  signed_on?: SignedOn;
  status?: ContractStatus;
  terms?: Terms;
  type: ContractType;
}
/**
 * A file that IS the contract, or a version of it.
 */
export interface ContractDocument {
  document_kind: DocumentKind;
  md5?: Md5;
  storage_key: StorageKey;
  version: Version;
}
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
/**
 * A payment due on signature.
 *
 * `creditable` is the whole reason this is a field rather than an invoice line. Two counterparties
 * each pay the same amount on signature and the two payments behave differently: one is
 * non-refundable and NOT creditable against future commission, the other draws down against
 * commission dollar for dollar until it is consumed. Getting that backwards overstates what we are
 * owed by the whole amount, on a screen, to the person deciding whether to chase it.
 */
export interface CommitmentPayment {
  amount: RecordedAmount;
  creditable: Creditable;
  due_on_signature?: DueOnSignature;
  kind?: Kind1;
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
/**
 * What happens when the counterparty's own customer renews.
 */
export interface RenewalRule {
  kind?: Kind2;
  material_contribution_presumed_months?: MaterialContributionPresumedMonths;
  notice_days?: NoticeDays;
  restarts_at_year_one: RestartsAtYearOne;
}
/**
 * How long commission keeps running after the agreement itself ends.
 */
export interface RunOffPeriod {
  kind?: Kind3;
  months: Months;
}
/**
 * A thing that has to be true, not a payment.
 *
 * A Foundry venture earns nothing and is measured by whether it can support its founder. The
 * threshold is a `RecordedAmount` when the measure is money and absent when it is not.
 */
export interface Milestone {
  description: Description;
  kind?: Kind4;
  measure: Measure;
  sustained_months?: SustainedMonths;
  threshold?: RecordedAmount | null;
}
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
  kind?: Kind5;
  provisional?: Provisional;
  vesting_months?: VestingMonths;
}
/**
 * The date by which something must have happened, or a stated remedy applies.
 */
export interface LongStop {
  kind?: Kind6;
  months: Months1;
  provisional?: Provisional1;
  remedy?: Remedy;
}
/**
 * A non-compete or non-solicit, with its carve-outs.
 */
export interface Restraint {
  carve_out?: CarveOut;
  kind?: Kind7;
  months: Months2;
  provisional?: Provisional2;
  restraint_type: RestraintType;
}
/**
 * How long the counterparty has to pay, and in what.
 */
export interface PaymentTerms {
  currency: Currency;
  days: Days;
  kind?: Kind8;
  method?: Method;
}
