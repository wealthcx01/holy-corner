import { beforeEach, describe, expect, it } from 'vitest';
import { withTestDb } from '../db/testing';
import type { Db } from '../db/driver';
import type { Principal } from '../authz';
import {
  ApprovalRefused,
  contentHashOf,
  eventsFor,
  execute,
  grant,
  narrate,
  project,
  propose,
  reject,
  type ExecutorRegistry,
} from '../approvals';

const SECRET = 'a-test-approval-secret-long-enough-to-be-real';

const human = (email = 'john@bruntsfield.capital'): Principal => ({
  sub: email,
  email,
  role: 'admin',
  pillars: [],
});

beforeEach(() => {
  process.env.HC_APPROVAL_SECRET = SECRET;
});

/** An executor that records whether it ran, so "nothing external happened" is checkable. */
function spyExecutor() {
  const calls: Record<string, unknown>[] = [];
  const registry: ExecutorRegistry = {
    'invoice.send': async (payload) => {
      calls.push(payload);
      return { sent: true };
    },
    'invoice.explode': async () => {
      throw new Error('the mail server said no');
    },
  };
  return { calls, registry };
}

async function aProposal(db: Db, kind = 'invoice.send', payload = { invoice: 'INV-1', amountMinor: 50_000 }) {
  const event = await propose(db, {
    scope: 'invoice:INV-1',
    kind,
    subject: 'INV-1',
    payload,
    actorId: 'composer',
  });
  return event.proposalId;
}

describe('proposing', () => {
  it('records a proposal nobody has decided, with the payload hashed', async () => {
    await withTestDb(async (db) => {
      const id = await aProposal(db);
      const state = project(await eventsFor(db, id));
      expect(state?.status).toBe('proposed');
      expect(state?.proposedBy).toBe('composer');
      expect(state?.contentHash).toBe(contentHashOf({ invoice: 'INV-1', amountMinor: 50_000 }));
      expect(state?.refusedEvents).toBe(0);
    });
  });

  it('hashes the payload independently of key order', async () => {
    // A jsonb column does not return keys in the order they went in. If the hash depended on that,
    // a grant would stop matching its own payload the first time the row was read back.
    expect(contentHashOf({ a: 1, b: { c: 2, d: 3 } })).toBe(contentHashOf({ b: { d: 3, c: 2 }, a: 1 }));
  });
});

describe('only a person decides', () => {
  it('records a grant against the person who gave it', async () => {
    await withTestDb(async (db) => {
      const id = await aProposal(db);
      await grant(db, id, human());
      const state = project(await eventsFor(db, id));
      expect(state?.status).toBe('granted');
      expect(state?.decidedBy).toBe('john@bruntsfield.capital');
    });
  });

  it('refuses a second answer to a decision already made', async () => {
    await withTestDb(async (db) => {
      const id = await aProposal(db);
      await grant(db, id, human());
      await expect(grant(db, id, human())).rejects.toThrow(ApprovalRefused);
      await expect(reject(db, id, human())).rejects.toThrow(ApprovalRefused);
    });
  });

  it('cannot be called as an agent, because the type will not allow it', async () => {
    // `grant` takes a Principal, which is a signed-in person. There is no argument that could make
    // it an agent, so this is a gate the compiler holds rather than a check somebody could forget.
    await withTestDb(async (db) => {
      const id = await aProposal(db);
      const events = await eventsFor(db, id);
      await grant(db, id, human());
      const after = await eventsFor(db, id);
      const granted = after.find((e) => e.type === 'approval.granted');
      expect(granted?.actorKind).toBe('human');
      expect(events.length).toBeLessThan(after.length);
    });
  });
});

describe('the load-bearing refusal', () => {
  it('REFUSES TO EXECUTE WITHOUT A GRANT, and nothing external happens', async () => {
    // HC-042's first acceptance criterion, and the one every other property here protects.
    await withTestDb(async (db) => {
      const { calls, registry } = spyExecutor();
      const id = await aProposal(db);
      await expect(execute(db, id, 'executor-1', registry)).rejects.toThrow(ApprovalRefused);
      expect(calls, 'the executor must not have run').toEqual([]);
      const state = project(await eventsFor(db, id));
      expect(state?.status).toBe('proposed');
    });
  });

  it('refuses to execute something that was refused', async () => {
    await withTestDb(async (db) => {
      const { calls, registry } = spyExecutor();
      const id = await aProposal(db);
      await reject(db, id, human());
      await expect(execute(db, id, 'executor-1', registry)).rejects.toThrow(/not granted/);
      expect(calls).toEqual([]);
    });
  });

  it('refuses when the grant event exists but its attestation does not verify', async () => {
    // The forged row: somebody with database access appends a grant. Without the secret they
    // cannot sign it, and this is where that shows up.
    await withTestDb(async (db) => {
      const { calls, registry } = spyExecutor();
      const id = await aProposal(db);
      await db.query(
        `INSERT INTO approval_events
           (scope, proposal_id, type, at, actor_kind, actor_id, data, content_hash, attestation)
         VALUES ('invoice:INV-1', $1, 'approval.granted', now(), 'human', 'attacker@example.com',
                 '{}'::jsonb, 'sha256:whatever', 'not-a-real-signature')`,
        [id],
      );
      await expect(execute(db, id, 'executor-1', registry)).rejects.toThrow(ApprovalRefused);
      expect(calls).toEqual([]);
    });
  });

  it('is not fooled by a tampered projection row, because it reads the log', async () => {
    // The `proposals` table is a convenience and is NOT append-only, so it is the easy thing to
    // edit. The hash is recomputed from the events, so editing it changes nothing.
    await withTestDb(async (db) => {
      const { calls, registry } = spyExecutor();
      const id = await aProposal(db);
      await grant(db, id, human());
      await db.query("UPDATE proposals SET content_hash = 'sha256:different' WHERE id = $1", [id]);
      const outcome = await execute(db, id, 'executor-1', registry);
      expect(outcome.status).toBe('executed');
      expect(calls).toEqual([{ invoice: 'INV-1', amountMinor: 50_000 }]);
    });
  });

  it('REFUSES WHEN A SECOND PAYLOAD IS APPENDED AFTER THE GRANT', async () => {
    // "Approve this payment of five hundred" must not become five thousand between the yes and the
    // doing. Append-only stops an UPDATE; it does not stop an INSERT, so this is the shape the
    // attack actually takes, and it is the one HC-042's criterion is about.
    await withTestDb(async (db) => {
      const { calls, registry } = spyExecutor();
      const id = await aProposal(db, 'invoice.send', { invoice: 'INV-1', amountMinor: 50_000 });
      await grant(db, id, human());
      await db.query(
        `INSERT INTO approval_events
           (scope, proposal_id, type, at, actor_kind, actor_id, data, content_hash, attestation)
         VALUES ('invoice:INV-1', $1, 'approval.proposed', now(), 'agent', 'composer',
                 '{"invoice":"INV-1","amountMinor":5000000}'::jsonb, 'sha256:x', 'forged')`,
        [id],
      );
      await expect(execute(db, id, 'executor-1', registry)).rejects.toThrow(ApprovalRefused);
      expect(calls, 'nothing external may happen').toEqual([]);
    });
  });

  it('refuses when no executor is registered for the kind', async () => {
    // A proposal whose action nobody implemented must not report success.
    await withTestDb(async (db) => {
      const { registry } = spyExecutor();
      const id = await aProposal(db, 'invoice.teleport');
      await grant(db, id, human());
      await expect(execute(db, id, 'executor-1', registry)).rejects.toThrow(/no executor/);
    });
  });
});

describe('executing', () => {
  it('runs the action and records that it did', async () => {
    await withTestDb(async (db) => {
      const { calls, registry } = spyExecutor();
      const id = await aProposal(db);
      await grant(db, id, human());
      const outcome = await execute(db, id, 'executor-1', registry);

      expect(outcome.status).toBe('executed');
      expect(calls).toEqual([{ invoice: 'INV-1', amountMinor: 50_000 }]);

      const types = (await eventsFor(db, id)).map((e) => e.type);
      expect(types).toEqual([
        'approval.proposed',
        'approval.granted',
        'action.executing',
        'action.executed',
      ]);
    });
  });

  it('records a failure rather than swallowing it', async () => {
    // A gate that goes quiet on failure cannot be told from one that never fired.
    await withTestDb(async (db) => {
      const { registry } = spyExecutor();
      const id = await aProposal(db, 'invoice.explode');
      await grant(db, id, human());
      const outcome = await execute(db, id, 'executor-1', registry);

      expect(outcome.status).toBe('failed');
      const events = await eventsFor(db, id);
      const failed = events.find((e) => e.type === 'action.failed');
      expect(failed?.data.error).toBe('the mail server said no');
      expect(project(events)?.status).toBe('failed');
    });
  });
});

describe('the log cannot be quietly changed', () => {
  it('discards an UPDATE and a DELETE, because the database refuses them', async () => {
    await withTestDb(async (db) => {
      const id = await aProposal(db);
      await db.query("UPDATE approval_events SET actor_id = 'somebody-else'");
      await db.query('DELETE FROM approval_events');
      const events = await eventsFor(db, id);
      expect(events.length).toBe(1);
      expect(events[0].actorId).toBe('composer');
    });
  });

  it('counts an event it cannot verify instead of skipping it', async () => {
    // A trail that quietly drops what it cannot read is worse than one with a visible hole,
    // because it looks complete.
    await withTestDb(async (db) => {
      const id = await aProposal(db);
      await db.query(
        `INSERT INTO approval_events
           (scope, proposal_id, type, at, actor_kind, actor_id, data, content_hash, attestation)
         VALUES ('invoice:INV-1', $1, 'approval.granted', now(), 'human', 'attacker@example.com',
                 '{}'::jsonb, 'sha256:x', 'forged')`,
        [id],
      );
      const state = project(await eventsFor(db, id));
      expect(state?.refusedEvents).toBe(1);
      // And it does NOT read as "still waiting on you": somebody tried to force a yes, and that is
      // a different fact from nobody having decided.
      expect(state?.status).toBe('unverified');
    });
  });

  it('refuses everything when the secret is missing, rather than accepting everything', async () => {
    await withTestDb(async (db) => {
      const id = await aProposal(db);
      await grant(db, id, human());
      delete process.env.HC_APPROVAL_SECRET;
      const state = project(await eventsFor(db, id));
      expect(state?.refusedEvents).toBe(2);
      expect(state?.status).toBe('unverified');
    });
  });
});

describe('replaying the log reproduces the projection', () => {
  it('agrees with the proposals table for every proposal', async () => {
    // HC-042's criterion. The log is the truth and the table is a convenience; if they ever
    // disagree, this is what says so.
    await withTestDb(async (db) => {
      const { registry } = spyExecutor();
      const executed = await aProposal(db);
      await grant(db, executed, human());
      await execute(db, executed, 'executor-1', registry);

      const rejected = await aProposal(db);
      await reject(db, rejected, human());

      const waiting = await aProposal(db);

      const { rows } = await db.query('SELECT id, status FROM proposals ORDER BY id');
      expect(rows.length).toBe(3);
      for (const row of rows) {
        const id = String(row.id);
        const replayed = project(await eventsFor(db, id));
        expect(replayed?.status, `${id} projection disagrees with its log`).toBe(String(row.status));
      }
      expect(new Set(rows.map((r) => String(r.status)))).toEqual(
        new Set(['executed', 'rejected', 'proposed']),
      );
      expect([executed, rejected, waiting].length).toBe(3);
    });
  });
});

describe('the trail reads as sentences', () => {
  it('says what happened in words, not event names', async () => {
    await withTestDb(async (db) => {
      const { registry } = spyExecutor();
      const id = await aProposal(db);
      await grant(db, id, human());
      await execute(db, id, 'executor-1', registry);

      const lines = (await eventsFor(db, id)).map(narrate);
      expect(lines[0]).toMatch(/composer proposed this, and it is waiting for a person/);
      expect(lines[1]).toMatch(/john@bruntsfield\.capital approved it/);
      expect(lines[3]).toMatch(/done/);
      for (const line of lines) {
        expect(line, `"${line}" still reads like an event name`).not.toMatch(/approval\.|action\./);
      }
    });
  });
});
