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
 * Other names the same organisation is known by.
 */
export type Aliases = string[];
/**
 * The name as it appears on a contract.
 */
export type CanonicalName = string;
/**
 * ISO 3166-1 alpha-2 codes where this organisation operates or is registered.
 */
export type Countries = string[];
export type Domain = string | null;
/**
 * Stable slug, e.g. 'openbb'.
 */
export type Id = string;
export type Notes = string | null;
/**
 * A Bruntsfield vertical. Three are live or building; three are names with a plan.
 */
export type Pillar = 'advisory' | 'foundry' | 'clients' | 'briefing' | 'equity' | 'cohort';
/**
 * Which Bruntsfield pillars have a relationship with this one.
 */
export type PillarFlags = Pillar[];
/**
 * Coarse sector hint, e.g. 'Neobank' or 'Data infrastructure'.
 */
export type Segment = string | null;
export type OrganisationStatus = 'prospect' | 'active' | 'dormant' | 'closed';
/**
 * What kind of organisation this is, from Holy Corner's point of view.
 */
export type OrganisationType =
  | 'brokerage_platform'
  | 'infrastructure_vendor'
  | 'data_provider'
  | 'investment_firm'
  | 'regulator'
  | 'association'
  | 'partner'
  | 'client'
  | 'founder_venture'
  | 'other';

/**
 * One organisation, whichever pillar met it first.
 *
 * `pillar_flags` is a set rather than a single pillar deliberately: an Advisory partner today may
 * be a Briefing subject tomorrow and an Equity target after that, and the register has to hold
 * that without the record being duplicated once per pillar.
 */
export interface Organisation {
  aliases?: Aliases;
  canonical_name: CanonicalName;
  countries?: Countries;
  domain?: Domain;
  id: Id;
  notes?: Notes;
  pillar_flags?: PillarFlags;
  segment?: Segment;
  status?: OrganisationStatus;
  type: OrganisationType;
}
