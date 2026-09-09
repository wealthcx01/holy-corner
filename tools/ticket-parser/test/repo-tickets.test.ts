import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseTicket } from '../src/index';

/**
 * The real ticket set in this repository must parse cleanly - all of it, every time.
 *
 * HC-001's acceptance criterion is "`make parse-tickets` parses every `HC-*.md` with zero
 * warnings". The fixture corpus cannot deliver that on its own: fixtures are a copied sample, and
 * a ticket filed next week is not in it. This test reads `docs/tickets/` itself, so the day
 * somebody files a ticket with no id, a title the parser cannot find, or a status word that is not
 * in the vocabulary, CI says so on that pull request rather than months later.
 *
 * Reading the working tree is deterministic here, unlike fountainbridge's equivalent: the tickets
 * are in this same repository, so there is no network and no fixture drift.
 */

const TICKETS = join(import.meta.dirname, '..', '..', '..', 'docs', 'tickets');

test('every ticket in docs/tickets parses with zero warnings', () => {
  const files = readdirSync(TICKETS).filter((f) => f.endsWith('.md')).sort();
  assert.ok(files.length >= 37, `expected the full ticket set, found ${files.length} files`);

  const complaints: string[] = [];
  for (const file of files) {
    const content = readFileSync(join(TICKETS, file), 'utf8');
    const { ticket, warnings } = parseTicket(content, {
      repo: 'holy-corner',
      path: `docs/tickets/${file}`,
    });
    if (warnings.length) {
      complaints.push(`${file} → ${warnings.map((w) => `${w.code}: ${w.message}`).join('; ')}`);
    }
    // The id in the heading and the id in the filename must be the same id. They are the ticket's
    // name in two places, and a ticket whose name disagrees with itself cannot be referred to.
    const fromName = file.match(/^([A-Z][A-Z0-9]+-\d+[a-z]?)-/)?.[1];
    assert.equal(ticket.id, fromName, `${file}: heading id "${ticket.id}" ≠ filename id "${fromName}"`);
  }

  console.log(`[repo] ${files.length} tickets parsed, ${complaints.length} with warnings`);
  assert.equal(complaints.length, 0, `tickets did not parse cleanly:\n  - ${complaints.join('\n  - ')}`);
});

test('every ticket declares a branch that matches its own id and filename', () => {
  const files = readdirSync(TICKETS).filter((f) => f.endsWith('.md')).sort();
  const wrong: string[] = [];
  for (const file of files) {
    const { ticket } = parseTicket(readFileSync(join(TICKETS, file), 'utf8'), {
      repo: 'holy-corner',
      path: `docs/tickets/${file}`,
    });
    // CLAUDE.md #1: one ticket = one branch = one PR, and the branch is the filename lowercased.
    const expected = file.replace(/\.md$/, '').toLowerCase();
    if (ticket.branch !== expected) wrong.push(`${file} → declares "${ticket.branch}", expected "${expected}"`);
  }
  assert.equal(wrong.length, 0, `branch names disagree with their tickets:\n  - ${wrong.join('\n  - ')}`);
});
