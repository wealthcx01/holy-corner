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
 * A typed edge between two organisations. Directional: `source` does this to `target`.
 */
export type RelationshipKind =
  'uses' | 'owns' | 'supplies' | 'competes_with' | 'partners_with' | 'parent_of';
export type Note = string | null;
export type SourceOrganisationId = string;
export type TargetOrganisationId = string;

/**
 * "A uses B", "A is the parent of B". Typed, so it can be asked about rather than read.
 */
export interface OrganisationRelationship {
  kind: RelationshipKind;
  note?: Note;
  source_organisation_id: SourceOrganisationId;
  target_organisation_id: TargetOrganisationId;
}
