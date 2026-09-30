/**
 * The shared contract types, as the rest of Holy Corner imports them.
 *
 * `generated/` beside this file holds one module per contract, produced from the vendored JSON
 * Schemas and marked DO NOT EDIT. Each is noisy - the generator emits a named alias for every
 * described property - and several of those aliases share names across contracts, which is exactly
 * why they are in separate modules rather than one file.
 *
 * So this file names what is real: twenty-four contracts, each by its own name, and nothing else.
 *
 * ## The rule this module exists to enforce
 *
 * CLAUDE.md #6: nothing else in `lib/` defines a shape that exists in the package. Both sibling
 * studios hand-wrote their TypeScript copies of these contracts and both drifted, and a
 * hand-written type that disagrees with the schema is worse than no type at all, because the
 * compiler enforces the wrong shape with complete confidence.
 *
 * Changing a contract means changing `packages/bcap_contracts` in the grassmarket repository,
 * re-vendoring `schema/`, and regenerating. Schemas win on conflict. `make contracts-parity`
 * fails the build if the committed types and the vendored schemas disagree.
 */

// Money. Two kinds, deliberately not interchangeable: `Money` carries the assumptions behind a
// modelled figure, `RecordedAmount` carries the source an observed one was read from.
export type { Money } from './generated/Money';
export type { RecordedAmount } from './generated/RecordedAmount';

// The register.
export type { Organisation } from './generated/Organisation';
export type { OrganisationRelationship } from './generated/OrganisationRelationship';
export type { Person } from './generated/Person';

// Contracts, and their commercial terms as typed rows.
export type { Contract } from './generated/Contract';
export type { ContractDocument } from './generated/ContractDocument';
export type { CommissionRate } from './generated/CommissionRate';
export type { CommitmentPayment } from './generated/CommitmentPayment';
export type { RenewalRule } from './generated/RenewalRule';
export type { RunOffPeriod } from './generated/RunOffPeriod';
export type { Milestone } from './generated/Milestone';
export type { EquitySplit } from './generated/EquitySplit';
export type { LongStop } from './generated/LongStop';
export type { Restraint } from './generated/Restraint';
export type { PaymentTerms } from './generated/PaymentTerms';

// Money out and money in.
export type { Invoice } from './generated/Invoice';
export type { InvoiceLine } from './generated/InvoiceLine';
export type { Payment } from './generated/Payment';
export type { CommissionReceivable } from './generated/CommissionReceivable';
export type { CostCentre } from './generated/CostCentre';
export type { Expense } from './generated/Expense';

// The gate (HC-042 implements the log these describe).
export type { ApprovalEvent } from './generated/ApprovalEvent';
export type { Proposal } from './generated/Proposal';
