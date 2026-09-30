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

export type ContractId = string | null;
export type Id = string;
export type Name = string;
/**
 * The venture or client this centre exists for, where there is one.
 */
export type OrganisationId = string | null;
/**
 * A Bruntsfield vertical. Three are live or building; three are names with a plan.
 */
export type Pillar = 'advisory' | 'foundry' | 'clients' | 'briefing' | 'equity' | 'cohort';

/**
 * Where money goes, grouped so a pillar can have a profit and loss.
 */
export interface CostCentre {
  contract_id?: ContractId;
  id: Id;
  name: Name;
  organisation_id?: OrganisationId;
  pillar: Pillar;
}
