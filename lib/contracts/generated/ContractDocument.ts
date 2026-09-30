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

/**
 * A file that IS the contract, or a version of it.
 */
export interface ContractDocument {
  document_kind: DocumentKind;
  md5?: Md5;
  storage_key: StorageKey;
  version: Version;
}
