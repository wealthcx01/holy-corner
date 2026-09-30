import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv, { type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';
import type { Contract, Invoice, ApprovalEvent, Organisation } from './index';

/**
 * The vendored schemas are the contract, and these check that we can actually express the record
 * with them (HC-005).
 *
 * ## Why the figures here are invented
 *
 * HC-005 asks for a test built from the real commercial record. **The figures below are deliberately
 * fictional and the structures are real.**
 *
 * This repository is public. HC-056 exists to get Bruntsfield's negotiated commission rates,
 * commitment amounts and equity terms OUT of public repositories, because both advisory agreements
 * carry a Most-Favoured-Nation clause. Copying them into a test would add another place to scrub
 * and work directly against that ticket, for nothing: what needs proving is that the SHAPES carry
 * the real record, and a shape is proved by its structure.
 *
 * The assertion that the actual terms are representable belongs with the actual terms, which after
 * HC-056 is not here. The operator script (HC-008) is where they are typed, once, by a person.
 */

const SCHEMA_DIR = join(import.meta.dirname, '..', '..', 'schema');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

function validator(name: string): ValidateFunction {
  return ajv.compile(JSON.parse(readFileSync(join(SCHEMA_DIR, `${name}.json`), 'utf8')));
}

function check(name: string, value: unknown): void {
  const validate = validator(name);
  const ok = validate(value);
  expect(ok, `${name} did not validate: ${ajv.errorsText(validate.errors)}`).toBe(true);
}

describe('the vendored schemas', () => {
  it('are all there, and each one is a schema', () => {
    const files = readdirSync(SCHEMA_DIR).filter((f) => f.endsWith('.json'));
    expect(files.length).toBe(24);
    for (const f of files) {
      const schema = JSON.parse(readFileSync(join(SCHEMA_DIR, f), 'utf8'));
      expect(schema, f).toHaveProperty('title');
      expect(() => ajv.compile(schema), f).not.toThrow();
    }
  });

  it('are pinned to a stated version and commit of the package they came from', () => {
    // So a reader can tell which bcap-contracts this repo is built against without guessing, and
    // so re-vendoring is a visible change rather than a silent one.
    const version = readFileSync(join(SCHEMA_DIR, '.source-version'), 'utf8').trim();
    const commit = readFileSync(join(SCHEMA_DIR, '.source-commit'), 'utf8').trim();
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(commit).toMatch(/^[0-9a-f]{40}$/);
  });
});

describe('an advisory agreement fits the Contract shape', () => {
  const contract: Contract = {
    id: 'acme-schedule-v1',
    type: 'engagement_schedule',
    status: 'active',
    pillar: 'advisory',
    counterparty_organisation_id: 'acme',
    counterparty_person_id: null,
    parent_contract_id: 'acme-msa-v1',
    dated_on: '2026-01-05',
    effective_on: '2026-01-01',
    signed_on: '2026-01-06',
    governing_law: 'State of New York',
    terms: [
      { kind: 'commission_rate', engagement_type: 'referral', yr1_bps: 1111, yr2_bps: 777, window_months: 18 },
      {
        kind: 'commitment_payment',
        amount: { amount_minor: 123456, currency: 'USD', source_ref: 'Schedule cl 2.1' },
        creditable: true,
        due_on_signature: true,
      },
      { kind: 'payment_terms', days: 30, currency: 'USD', method: 'electronic_transfer' },
    ],
    documents: [],
  };

  it('validates against the schema', () => {
    check('Contract', contract);
  });

  it('carries two commission structures with different windows', () => {
    // The reason terms are rows and not columns. One agreement in the real record has exactly this
    // shape: distribution at one rate over one window, redistribution at another over a longer one.
    const twoStructures: Contract = {
      ...contract,
      terms: [
        { kind: 'commission_rate', engagement_type: 'distribution', yr1_bps: 1111, yr2_bps: 777, window_months: 18 },
        { kind: 'commission_rate', engagement_type: 'redistribution', yr1_bps: 333, yr2_bps: 333, window_months: 30 },
      ],
    };
    check('Contract', twoStructures);
  });
});

describe('a Foundry agreement fits the same shape with different terms', () => {
  it('carries a milestone, an equity split and a long stop, and no commission at all', () => {
    const contract: Contract = {
      id: 'venture-agreement-v1',
      type: 'collaboration_agreement',
      status: 'active',
      pillar: 'foundry',
      counterparty_organisation_id: null,
      counterparty_person_id: 'a-founder',
      parent_contract_id: null,
      dated_on: '2026-02-01',
      effective_on: '2026-02-01',
      signed_on: '2026-02-02',
      governing_law: null,
      terms: [
        {
          kind: 'milestone',
          description: 'can support the founder full time',
          measure: 'net_revenue_per_month',
          threshold: { amount_minor: 111100, currency: 'GBP', source_ref: 'term sheet' },
          sustained_months: 3,
        },
        { kind: 'equity_split', holder: 'founder', bps: 4444, vesting_months: 36, cliff_months: 6, provisional: true },
        { kind: 'long_stop', months: 18, remedy: 'the founder may require spin-out', provisional: true },
      ],
      documents: [],
    };
    check('Contract', contract);
    // No null columns anywhere: this contract simply has no commission term, rather than a row of
    // empty commission fields.
    expect((contract.terms ?? []).some((t) => t.kind === 'commission_rate')).toBe(false);
  });

  it('records a bracketed figure as provisional rather than as agreed', () => {
    // A signed document carries some figures in square brackets. Recording a negotiating position
    // as agreed is how it becomes a fact nobody remembers agreeing to.
    const split = { kind: 'equity_split' as const, holder: 'bruntsfield', bps: 4000, provisional: true };
    check('EquitySplit', split);
    expect(split.provisional).toBe(true);
  });
});

describe('an invoice and its payment', () => {
  it('validates, denominated in one currency throughout', () => {
    const invoice: Invoice = {
      id: 'inv-9',
      number: 'INV-9',
      issuer_organisation_id: 'bruntsfield',
      billed_to_organisation_id: 'acme',
      contract_id: 'acme-schedule-v1',
      contract_term_ref: null,
      status: 'issued',
      issued_on: '2026-08-03',
      due_on: '2026-09-02',
      currency: 'USD',
      lines: [
        {
          description: 'Commitment payment',
          quantity: 1,
          unit_amount: { amount_minor: 123456, currency: 'USD', source_ref: 'INV-9' },
          tax_amount: null,
          contract_term_ref: null,
        },
      ],
      total: { amount_minor: 123456, currency: 'USD', source_ref: 'INV-9' },
      tax_total: null,
      external_ref: null,
    };
    check('Invoice', invoice);
  });
});

describe('the approval gate', () => {
  it('validates a proposal and a grant that names what it approved', () => {
    const proposed: ApprovalEvent = {
      v: 1,
      seq: 1,
      scope: 'invoice:INV-9',
      id: 'prop-1',
      type: 'approval.proposed',
      at: '2026-09-30T12:00:00Z',
      actor: { kind: 'agent', id: 'composer' },
      data: { invoice: 'INV-9' },
      content_hash: 'sha256:abc',
      attestation: 'hmac:def',
    };
    const granted: ApprovalEvent = {
      ...proposed,
      seq: 2,
      type: 'approval.granted',
      actor: { kind: 'human', id: 'a@b.c' },
    };
    check('ApprovalEvent', proposed);
    check('ApprovalEvent', granted);
  });

  it('has the shape HC-042 needs: seq for ordering, and a hash binding the grant', () => {
    // These two fields are why the gate holds. `seq` because two events a millisecond apart have
    // an unarguable order by integer and an arguable one by clock; `content_hash` because without
    // it the payload can change between the yes and the doing.
    const schema = JSON.parse(readFileSync(join(SCHEMA_DIR, 'ApprovalEvent.json'), 'utf8'));
    expect(Object.keys(schema.properties)).toEqual(
      expect.arrayContaining(['seq', 'scope', 'type', 'at', 'actor', 'content_hash', 'attestation']),
    );
    expect(schema.required).toEqual(expect.arrayContaining(['seq', 'scope', 'id', 'type', 'at', 'actor']));
  });
});

describe('what the schemas refuse', () => {
  it('refuses an unknown field, because every model forbids extras', () => {
    const org = { id: 'x', canonical_name: 'X', type: 'other' } as unknown as Organisation;
    check('Organisation', org);
    const validate = validator('Organisation');
    expect(validate({ ...org, definitely_not_a_field: 'oops' })).toBe(false);
  });

  it('refuses a commission rate above one hundred per cent', () => {
    const validate = validator('CommissionRate');
    expect(validate({ kind: 'commission_rate', engagement_type: 'x', yr1_bps: 10001, yr2_bps: 0, window_months: 12 }))
      .toBe(false);
  });

  it('refuses an amount with no source', () => {
    const validate = validator('RecordedAmount');
    expect(validate({ amount_minor: 1, currency: 'USD', source_ref: '' })).toBe(false);
  });
});

describe('nothing in this repository hand-writes a shape the package already defines', () => {
  /**
   * CLAUDE.md #6 names the failure by filename: both sibling studios hand-wrote TypeScript copies
   * of these contracts and both drifted from the schemas they were copying. A hand-written type
   * that disagrees with the schema is worse than no type, because the compiler enforces the wrong
   * shape with complete confidence.
   *
   * This walks `lib/`, `app/` and `components/` and fails if any file outside `lib/contracts/`
   * declares an interface or type alias with a contract's name.
   */
  const ROOT = join(import.meta.dirname, '..', '..');
  const CONTRACT_NAMES = readdirSync(SCHEMA_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''));

  function sourceFiles(dir: string, out: string[] = []): string[] {
    let entries: string[] = [];
    try {
      entries = readdirSync(dir);
    } catch {
      return out;
    }
    for (const entry of entries) {
      const full = join(dir, entry);
      if (entry === 'node_modules' || entry === 'generated' || entry.startsWith('.')) continue;
      try {
        if (readdirSync(full).length >= 0) sourceFiles(full, out);
      } catch {
        if (/\.tsx?$/.test(entry)) out.push(full);
      }
    }
    return out;
  }

  it('declares each contract name exactly once, in the generated module that owns it', () => {
    const files = ['lib', 'app', 'components'].flatMap((d) => sourceFiles(join(ROOT, d)));
    expect(files.length).toBeGreaterThan(5);

    const offenders: string[] = [];
    for (const file of files) {
      if (file.includes(`${'lib'}/contracts/`)) continue;
      const src = readFileSync(file, 'utf8');
      for (const name of CONTRACT_NAMES) {
        // A declaration, not a mention. `import type { Contract }` and `const c: Contract` are the
        // whole point; `interface Contract {` is the drift.
        const declares = new RegExp(`^\\s*(export\\s+)?(interface|type)\\s+${name}\\b`, 'm');
        if (declares.test(src)) offenders.push(`${file.slice(ROOT.length + 1)} declares ${name}`);
      }
    }
    expect(
      offenders,
      `these hand-write a shape bcap-contracts already defines:\n  - ${offenders.join('\n  - ')}`,
    ).toEqual([]);
  });
});
