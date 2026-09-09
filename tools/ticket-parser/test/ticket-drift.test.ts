import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  findDrift, idFromFilename, isShippingCommit, partShippedReason, statusFromMarkdown, ticketsShippedBy,
} from '../../../lib/ticket-drift';
import { parseDependsOn, parseTicket, looksLikeTicket } from '../src/index';

/**
 * Tests for `lib/ticket-drift.ts`, ported from fountainbridge's `lib/__tests__/ticket-drift.test.ts`
 * along with the module itself (HC-001). The first pass at HC-001 ported the module and left these
 * behind, which meant a REQUIRED CI check - "Tickets match the history" - shipped with six exported
 * functions and no test of any kind. Ported verbatim is not the same as covered.
 *
 * The FB ids throughout are fountainbridge's own history, kept because they are the evidence for
 * why each rule exists. Converted from vitest to `node --test`, because that is the only runner in
 * this repository until HC-002 brings the app and vitest with it. WHEN HC-002 LANDS, MOVE THIS FILE
 * to the root test suite next to the module it tests; it lives inside the parser's package only
 * because that package owns the sole test runner today.
 */

const evidence = (ids: string[], commit = 'abc1234 HC-065: something (#68)') => ({
  shipped: new Set(ids),
  commitFor: new Map(ids.map((id) => [id, commit])),
});

describe('what counts as evidence that a ticket shipped', () => {
  test('counts a code commit whose subject names the ticket', () => {
    assert.deepEqual(ticketsShippedBy({
      subject: 'FB-065: bring the composer inside the studio (#68)',
      paths: ['lib/composer.ts', 'docs/tickets/FB-065-x.md'],
    }), ['FB-065']);
  });

  test('ignores a commit that only filed paperwork', () => {
    assert.deepEqual(ticketsShippedBy({
      subject: 'docs: FB-060 - what the lane tells you, and in what shape (#61)',
      paths: ['docs/tickets/FB-060-x.md'],
    }), []);
  });

  test('does not treat a ticket FILED by a code commit as one that shipped', () => {
    // One pull request shipped FB-064 and *filed* five more. Keying on "this ticket's file changed
    // in a code commit" reported all five as shipped. Filing a ticket is not shipping it.
    assert.deepEqual(ticketsShippedBy({
      subject: 'docs: the founder’s journey, and the five tickets that deliver it (#67)',
      paths: ['lib/work.ts', 'docs/tickets/FB-067-x.md', 'docs/tickets/FB-068-x.md'],
    }), []);
  });

  test('ignores a passing reference in the body, because only the subject is deliberate', () => {
    assert.deepEqual(ticketsShippedBy({
      subject: 'FB-050: the venture brain (#50)',
      paths: ['deploy/lane/brain-query.mjs'],
    }), ['FB-050']);
  });

  test('knows a commit that changed code from one that did not', () => {
    assert.equal(isShippingCommit(['docs/tickets/FB-001-x.md']), false);
    assert.equal(isShippingCommit(['docs/tickets/FB-001-x.md', 'lib/x.ts']), true);
    assert.equal(isShippingCommit([]), false);
    assert.equal(isShippingCommit(['   ']), false);
  });
});

describe('reporting the disagreement', () => {
  const ticket = (over = {}) => ({ id: 'HC-064', status: 'In review', file: 'docs/tickets/HC-064-x.md', ...over });

  test('flags a ticket whose work has shipped', () => {
    const d = findDrift([ticket()], evidence(['HC-064']));
    assert.equal(d.length, 1);
    assert.ok(d[0].message.includes('has shipped'));
    assert.ok(d[0].message.includes('abc1234'));
  });

  test('says nothing about a ticket that already admits it is done', () => {
    for (const status of ['Done', 'done', 'Shipped', 'Merged']) {
      assert.equal(findDrift([ticket({ status })], evidence(['HC-064'])).length, 0, status);
    }
  });

  test('accepts a concluded status that carries a qualifier', () => {
    // Demanding an exact match would make the check punish precision.
    for (const status of ['Closed - not a defect', 'Withdrawn - superseded by HC-072', 'Done (partly reverted)']) {
      assert.equal(findDrift([ticket({ status })], evidence(['HC-064'])).length, 0, status);
    }
  });

  test('still flags a status that merely starts with a word like "in"', () => {
    for (const status of ['In review', 'In progress (design)', 'Not done yet']) {
      assert.equal(findDrift([ticket({ status })], evidence(['HC-064'])).length, 1, status);
    }
  });

  test('says nothing about a ticket with no shipping evidence', () => {
    assert.equal(findDrift([ticket()], evidence([])).length, 0);
  });

  test('never flags a ticket marked done with no commit behind it', () => {
    // Deliberately one-directional. HC-001's acceptance criterion asked for this direction; the
    // module refuses it on purpose, because plenty of legitimate work leaves no commit naming it.
    assert.equal(findDrift([ticket({ status: 'Done' })], evidence([])).length, 0);
  });

  test('reads worse for a ticket nobody has even started', () => {
    assert.ok(findDrift([ticket({ status: 'Todo' })], evidence(['HC-064']))[0].message
      .includes('has already shipped'));
  });

  test('accepts a ticket that says in writing what has not shipped', () => {
    // The escape hatch HC-001 itself uses: without it a part-finished ticket could only pass by
    // being marked Done, which is the same lie reached by a different route.
    assert.equal(
      findDrift([ticket({ partShipped: 'branch protection is not applied' })], evidence(['HC-064'])).length,
      0,
    );
  });

  test('tells you about the escape hatch instead of only demanding Done', () => {
    assert.ok(findDrift([ticket()], evidence(['HC-064']))[0].message.includes('Shipped in part'));
  });

  test('reports in ticket order, so the same repository always reads the same way', () => {
    const d = findDrift(
      [ticket({ id: 'HC-100' }), ticket({ id: 'HC-9' }), ticket({ id: 'HC-64' })],
      evidence(['HC-100', 'HC-9', 'HC-64']),
    );
    assert.deepEqual(d.map((x) => x.id), ['HC-9', 'HC-64', 'HC-100']);
  });
});

describe('reading a ticket file', () => {
  test('takes the status without swallowing the rest of the header', () => {
    assert.equal(statusFromMarkdown('# T\n\n**Status:** Done · **Phase:** 3 · **Repo:** x\n'), 'Done');
  });

  test('keeps a status that has words in it', () => {
    assert.equal(statusFromMarkdown('**Status:** In progress (design) · **Phase:** 2'), 'In progress (design)');
  });

  test('returns nothing for a file with no status line', () => {
    assert.equal(statusFromMarkdown('# A ticket with no header\n'), null);
  });

  test('reads the part-shipped explanation, and requires one', () => {
    assert.equal(partShippedReason('**Shipped in part:** the executor is not deployed yet.'),
      'the executor is not deployed yet.');
    assert.equal(partShippedReason('**Shipped in part:**'), null);
  });

  test('gets the id from the filename', () => {
    assert.equal(idFromFilename('HC-064-read-and-accept-work.md'), 'HC-064');
    assert.equal(idFromFilename('GRS-0147b-something.md'), 'GRS-0147b');
    assert.equal(idFromFilename('README.md'), null);
  });
});

/**
 * A ticket-id range is not evidence (fountainbridge FB-145).
 *
 * This is not a hypothetical here. THIS repository's seeding commit is subjected "Holy Corner:
 * plan, commercial record, and the HC-001 to HC-053 ticket set", and it changed code as well as
 * tickets. Without this rule, ticket-drift reads both endpoints as shipped and demands HC-001 and
 * HC-053 be marked Done. The first CI run on this repository would have been red.
 */
describe('a range names a set the string does not enumerate (FB-145)', () => {
  const paths = ['lib/anything.ts'];

  test('yields nothing for this repository’s own seeding commit', () => {
    assert.deepEqual(ticketsShippedBy({
      subject: 'Holy Corner: plan, commercial record, and the HC-001 to HC-053 ticket set',
      paths,
    }), []);
  });

  test('yields nothing for the exact subject that broke fountainbridge’s main', () => {
    assert.deepEqual(ticketsShippedBy({
      subject: 'The desk redesign: design bundle, two decision memos, and FB-124…FB-142 (#150)',
      paths,
    }), []);
  });

  test('handles every way someone writes a range', () => {
    for (const subject of [
      'Planning HC-124...HC-142',
      'Planning HC-124..HC-142',
      'Planning HC-124 – HC-142',
      'Planning HC-124 — HC-142',
      'Planning HC-124 to HC-142',
    ]) {
      assert.deepEqual(ticketsShippedBy({ subject, paths }), [], subject);
    }
  });

  test('still counts a single id, which is the case this check exists for', () => {
    assert.deepEqual(ticketsShippedBy({ subject: 'HC-123: stop doing the thing (#148)', paths }), ['HC-123']);
  });

  test('still counts two ids named individually', () => {
    assert.deepEqual(ticketsShippedBy({ subject: 'HC-121 and HC-122: two real ships', paths }),
      ['HC-121', 'HC-122']);
  });

  test('still ignores a commit that shipped no code, whatever its subject says', () => {
    assert.deepEqual(ticketsShippedBy({ subject: 'HC-123: ticket only', paths: ['docs/tickets/HC-123-x.md'] }), []);
  });
});

/**
 * The two copies of the ticket-id pattern must agree.
 *
 * `lib/ticket-drift.ts` and `tools/ticket-parser/src/parse.ts` each carry their own copy, because
 * the parser is an isolated package that deliberately has no dependency on the repository root.
 * That is the fountainbridge FB-097 precedent for a duplicated four-character check: keep the copy,
 * and pin both sides so they cannot drift apart in silence.
 *
 * They HAD drifted, inside a single commit. HC-001 widened the parser so `SD3-0108` stopped
 * vanishing from HC-015's dependency list, and left ticket-drift on the old pattern, where
 * `idFromFilename('SD3-0108-x.md')` returned null. The same silent hole, thirty lines away, in the
 * module whose own header says a check that quietly does nothing is indistinguishable from one that
 * found nothing.
 */
describe('the drift check and the parser agree on what a ticket id is', () => {
  test('every real id in this estate is read by both', () => {
    for (const id of ['HC-015', 'SD3-0108', 'GRS-0147b', 'FB-004', 'ARCA-44']) {
      assert.equal(idFromFilename(`${id}-some-slug.md`), id, `idFromFilename lost ${id}`);
      assert.deepEqual(parseDependsOn(id), [id], `parseDependsOn lost ${id}`);
      assert.deepEqual(ticketsShippedBy({ subject: `${id}: ship it`, paths: ['lib/x.ts'] }), [id],
        `ticketsShippedBy lost ${id}`);
      assert.equal(parseTicket(`# ${id} - a title\n`, { repo: 'r', path: `docs/tickets/${id}-x.md` }).ticket.id, id,
        `parseTicket lost ${id}`);
    }
  });

  test('neither reads a quarter or half label as a ticket id', () => {
    // The first attempt at the SD3 fix was `[A-Z][A-Z0-9]+`, which made Q1-2026 a ticket id. In an
    // advisory firm's repository "due after Q1-2026" is ordinary prose, not a dependency.
    for (const label of ['Q1-2026', 'H1-2026', 'A-1']) {
      assert.equal(idFromFilename(`${label}-plan.md`), null, `idFromFilename invented ${label}`);
      assert.deepEqual(parseDependsOn(`due after ${label}`), [], `parseDependsOn invented ${label}`);
      assert.deepEqual(ticketsShippedBy({ subject: `the ${label} plan`, paths: ['lib/x.ts'] }), [],
        `ticketsShippedBy invented ${label}`);
    }
    const r = parseTicket('# Q1-2026 - Revenue plan\n', { repo: 'r', path: 'docs/tickets/Q1-2026-revenue.md' });
    assert.equal(looksLikeTicket(r), false, 'a quarterly plan must not render as a ticket');
  });
});
