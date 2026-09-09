import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { parseTicket } from '../src/index';

/**
 * Every parsed Ticket - from clean templates AND from malformed edge cases - must validate against
 * the vendored bcap-contracts Ticket JSON Schema. This is the guarantee that makes graceful
 * degradation safe: a malformed ticket file never produces an off-contract object.
 *
 * IT IS NOT RUNNING YET, AND IT SAYS SO OUT LOUD.
 *
 * `schema/` is vendored by HC-005, not by HC-001, and CLAUDE.md is explicit that a ticket does not
 * fabricate the next one's work. So this test looks for the schema and, when it is absent, skips
 * with a message naming the ticket that turns it on. It arms itself the moment HC-005 lands the
 * file - no edit required, and nothing to remember.
 *
 * The skip is deliberately LOUD. ticket-drift's own lesson applies here: a check that quietly does
 * nothing is indistinguishable from a check that found nothing.
 */

const SCHEMA_PATH = join(import.meta.dirname, '..', '..', '..', 'schema', 'Ticket.schema.json');
const HAVE_SCHEMA = existsSync(SCHEMA_PATH);

const FIX = join(import.meta.dirname, '..', 'fixtures');

function compileValidator() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  return { ajv, validate: ajv.compile(JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'))) };
}

function everyFixture(): Array<{ repo: string; path: string; content: string }> {
  const out: Array<{ repo: string; path: string; content: string }> = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.md')) {
        out.push({ repo: 'fixture', path: `docs/tickets/${entry.name}`, content: readFileSync(full, 'utf8') });
      }
    }
  };
  walk(FIX);
  return out;
}

test('every parsed ticket (clean and degraded) conforms to the Ticket contract', {
  skip: HAVE_SCHEMA
    ? false
    : 'schema/Ticket.schema.json is not vendored yet - HC-005 vendors it and this test then runs automatically.',
}, () => {
  const { ajv, validate } = compileValidator();
  const fixtures = everyFixture();
  assert.ok(fixtures.length > 0);
  for (const f of fixtures) {
    const { ticket } = parseTicket(f.content, { repo: f.repo, path: f.path });
    const ok = validate(ticket);
    assert.ok(ok, `${f.path} produced an off-contract Ticket: ${ajv.errorsText(validate.errors)}`);
  }
});
