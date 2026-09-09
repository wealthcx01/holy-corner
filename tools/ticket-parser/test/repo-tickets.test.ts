import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseTicket } from '../src/index';
import { idFromFilename } from '../../../lib/ticket-drift';

/**
 * Are the tickets ON DISK well formed?
 *
 * This is a DIFFERENT QUESTION from the one `parse.test.ts` and `corpus.test.ts` ask. Those two ask
 * "is the parser correct", and they ask it against frozen fixtures so that the answer does not
 * change when somebody edits a live ticket. This file asks whether the ticket set in the working
 * tree is well formed, and it reads `docs/tickets/` directly, so it DOES change when a ticket does.
 *
 * They are kept apart on purpose. Both feed the same CI job, and if one test covered both jobs a red
 * "Parse tickets" would never tell you which of the two had gone wrong: a parser regression and a
 * badly filed ticket would look identical. Each test below names its own cause in its own failure.
 *
 * HC-001's acceptance criterion - "`make parse-tickets` parses every `HC-*.md` with zero warnings" -
 * is this file's first test.
 */

const TICKETS = join(import.meta.dirname, '..', '..', '..', 'docs', 'tickets');

const ticketFiles = (): string[] =>
  readdirSync(TICKETS).filter((f) => f.endsWith('.md')).sort();

test('every file in docs/tickets is actually a ticket', () => {
  // Checked first and on its own, because it is the cause of the most confusing failure in this
  // file. A stray README or design note in that directory has no id, so the checks below would
  // report a mismatch against `undefined` rather than naming the real problem.
  const strays = ticketFiles().filter((f) => idFromFilename(f) === null);
  assert.deepEqual(strays, [],
    `these files are in docs/tickets but are not named like tickets: ${strays.join(', ')}`);
});

test('every ticket on disk parses with zero warnings', () => {
  const files = ticketFiles();
  // No floor on the count. A hard-coded minimum goes stale the moment a ticket is filed, and it
  // protects nothing: an empty directory is caught by this assertion, and a deleted ticket is a
  // deliberate act that no arbitrary number should veto.
  assert.ok(files.length > 0, `no ticket files found under ${TICKETS} - is the path right?`);

  const complaints: string[] = [];
  for (const file of files) {
    const { warnings } = parseTicket(readFileSync(join(TICKETS, file), 'utf8'), {
      repo: 'holy-corner',
      path: `docs/tickets/${file}`,
    });
    if (warnings.length) {
      complaints.push(`${file} → ${warnings.map((w) => `${w.code}: ${w.message}`).join('; ')}`);
    }
  }
  console.log(`[repo] ${files.length} tickets on disk, ${complaints.length} with warnings`);
  assert.deepEqual(complaints, [], `tickets did not parse cleanly:\n  - ${complaints.join('\n  - ')}`);
});

test('every ticket agrees with itself about its own id', () => {
  // The id in the heading and the id in the filename are the ticket's name written twice. A ticket
  // whose name disagrees with itself cannot be referred to, depended on, or approved by name
  // (fountainbridge FB-097). `idFromFilename` is imported rather than re-typed here: a fourth copy
  // of the id pattern is a fourth thing to keep in step by memory.
  const wrong: string[] = [];
  for (const file of ticketFiles()) {
    const { ticket } = parseTicket(readFileSync(join(TICKETS, file), 'utf8'), {
      repo: 'holy-corner',
      path: `docs/tickets/${file}`,
    });
    const fromName = idFromFilename(file);
    if (ticket.id !== fromName) wrong.push(`${file}: heading says "${ticket.id}", filename says "${fromName}"`);
  }
  assert.deepEqual(wrong, [], `tickets disagree with themselves:\n  - ${wrong.join('\n  - ')}`);
});

test('every ticket declares the branch its own filename implies', () => {
  // CLAUDE.md #1: one ticket = one branch = one PR, and the branch is the filename lowercased.
  const wrong: string[] = [];
  for (const file of ticketFiles()) {
    const { ticket } = parseTicket(readFileSync(join(TICKETS, file), 'utf8'), {
      repo: 'holy-corner',
      path: `docs/tickets/${file}`,
    });
    const expected = file.replace(/\.md$/, '').toLowerCase();
    if (ticket.branch !== expected) wrong.push(`${file} → declares "${ticket.branch}", expected "${expected}"`);
  }
  assert.deepEqual(wrong, [], `branch names disagree with their tickets:\n  - ${wrong.join('\n  - ')}`);
});
