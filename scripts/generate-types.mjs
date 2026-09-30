#!/usr/bin/env node
/**
 * Generate `lib/contracts/generated.ts` from the vendored JSON Schemas (HC-005).
 *
 *   node scripts/generate-types.mjs            write the file
 *   node scripts/generate-types.mjs --check    write nothing; fail if it would differ
 *
 * ## Why this exists at all
 *
 * CLAUDE.md #6 names the alternative by filename: both sibling studios hand-wrote their TypeScript
 * copies of these contracts, and both drifted from the schemas they were copying. A hand-written
 * type that disagrees with the schema is worse than no type, because the compiler will confidently
 * enforce the wrong shape.
 *
 * So the TypeScript is not written. It is generated, it is committed so a reader can see it, and
 * `make contracts-parity` regenerates it in CI and fails if the committed copy differs. Editing the
 * generated file by hand turns the build red on the next run, which is the point.
 *
 * ## Changing a contract
 *
 * Not here. A contract changes in `packages/bcap_contracts` in the grassmarket repository, which is
 * where the Pydantic models and the schemas live; then the schemas are re-vendored into `schema/`
 * and this regenerates. Schemas win on conflict.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from 'json-schema-to-typescript';

const SCHEMA_DIR = join(process.cwd(), 'schema');
const OUT_DIR = join(process.cwd(), 'lib', 'contracts', 'generated');

const files = readdirSync(SCHEMA_DIR).filter((f) => f.endsWith('.json')).sort();
if (files.length === 0) {
  console.error('generate-types: no schemas in schema/. Vendor them from bcap-contracts first.');
  process.exit(2);
}

const version = readFileSync(join(SCHEMA_DIR, '.source-version'), 'utf8').trim();
const commit = readFileSync(join(SCHEMA_DIR, '.source-commit'), 'utf8').trim();

const header = `/* eslint-disable */
/**
 * GENERATED FILE. DO NOT EDIT.
 *
 * Produced by \`node scripts/generate-types.mjs\` from the JSON Schemas vendored in \`schema/\`,
 * which come from \`packages/bcap_contracts\` in the grassmarket repository.
 *
 *   package version : ${version}
 *   source commit   : ${commit}
 *
 * A change to any of these shapes is made in that package and re-vendored, never here. Editing
 * this file turns the "Contracts parity" check red on the next run, which is what it is for
 * (CLAUDE.md #6: do not hand-author a parallel type).
 */

`;

/**
 * ONE FILE PER CONTRACT, in `lib/contracts/generated/`.
 *
 * Two earlier shapes were tried and both broke:
 *
 *   * All twenty-four nested under a single `$defs` and compiled once. Each schema carries its own
 *     internal `$defs`, so `#/$defs/ActorKind` inside ApprovalEvent.json stops resolving the moment
 *     that file is no longer the document root.
 *   * Compiled separately and concatenated into one file. TypeScript then sees duplicate
 *     identifiers: `Kind`, `Months`, `Provisional` and `RestraintType` each exist in several
 *     contracts, and `kind` is a different literal type in every term.
 *
 * A file each has neither problem. Every schema is its own module, so a name that appears in two
 * contracts is two names in two scopes, which is what it actually is. `lib/contracts/index.ts`
 * re-exports the twenty-four by name, and that is the only surface the rest of the code imports.
 */
const generated = new Map();

for (const file of files) {
  const schema = JSON.parse(readFileSync(join(SCHEMA_DIR, file), 'utf8'));
  const name = file.replace(/\.json$/, '');
  const ts = await compile(schema, name, {
    bannerComment: '',
    additionalProperties: false,
    style: { singleQuote: true, printWidth: 100 },
  });
  generated.set(`${name}.ts`, header + ts.trim() + '\n');
}

function currentFiles() {
  try {
    return new Map(
      readdirSync(OUT_DIR)
        .filter((f) => f.endsWith('.ts'))
        .map((f) => [f, readFileSync(join(OUT_DIR, f), 'utf8')]),
    );
  } catch {
    return new Map();
  }
}

if (process.argv.includes('--check')) {
  const committed = currentFiles();
  const problems = [];
  for (const [name, content] of generated) {
    if (!committed.has(name)) problems.push(`${name} is missing`);
    else if (committed.get(name) !== content) problems.push(`${name} differs from its schema`);
  }
  for (const name of committed.keys()) {
    if (!generated.has(name)) problems.push(`${name} has no schema and should not exist`);
  }
  if (problems.length > 0) {
    console.error('contracts-parity: the generated types do not match the vendored schemas.');
    for (const p of problems) console.error(`  - ${p}`);
    console.error('\nEither the schemas were re-vendored without regenerating, or a generated file');
    console.error('was edited by hand. Run: node scripts/generate-types.mjs');
    process.exit(1);
  }
  console.log(`contracts-parity: ${generated.size} schemas, generated types match.`);
  process.exit(0);
}

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });
for (const [name, content] of generated) writeFileSync(join(OUT_DIR, name), content);
console.log(`generate-types: wrote ${generated.size} files to ${OUT_DIR} (bcap-contracts ${version}).`);
