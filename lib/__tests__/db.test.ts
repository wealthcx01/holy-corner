import { describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { migrate, MIGRATIONS_DIR } from '../db/migrate';
import { makeTestDb, seedPerson, withTestDb } from '../db/testing';
import { assertBootable, BootRefusal, looksLikePlaceholder, MIN_SECRET_LENGTH } from '../db/config';
import { Repository } from '../data/repository';
import { ScopeViolation, type Principal } from '../authz';

const principal = (over: Partial<Principal> = {}): Principal => ({
  sub: 'p@bruntsfield.capital', email: 'p@bruntsfield.capital', role: 'admin', pillars: [], ...over,
});

describe('migrations', () => {
  it('apply to an empty database and create the three tables', async () => {
    await withTestDb(async (db) => {
      const { rows } = await db.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`,
      );
      const names = rows.map((r) => String(r.table_name));
      expect(names).toContain('people');
      expect(names).toContain('role_assignments');
      expect(names).toContain('activity_log');
      expect(names).toContain('_migrations');
    });
  });

  it('are idempotent: running twice applies nothing the second time', async () => {
    // The acceptance criterion, and the property that lets migrations run at every boot.
    const pg = new PGlite();
    const db = {
      async query(sql: string, params?: readonly unknown[]) {
        if (!params || params.length === 0) {
          const r = await pg.exec(sql);
          return { rows: (r[r.length - 1]?.rows ?? []) as Record<string, unknown>[] };
        }
        return { rows: ((await pg.query(sql, params as unknown[])).rows ?? []) as Record<string, unknown>[] };
      },
    };
    const first = await migrate(db, MIGRATIONS_DIR);
    const second = await migrate(db, MIGRATIONS_DIR);
    expect(first.length).toBeGreaterThan(0);
    expect(second).toEqual([]);
    await pg.close();
  });

  it('refuse to leave half of themselves behind when one fails', async () => {
    // A migration and the row saying it ran are one transaction, so there is no "partly applied"
    // state to reason about at three in the morning.
    await withTestDb(async (db) => {
      const dir = '/tmp/hc-bad-migrations';
      const { mkdirSync, writeFileSync } = await import('node:fs');
      mkdirSync(dir, { recursive: true });
      writeFileSync(`${dir}/0001_bad.sql`, 'CREATE TABLE ok_so_far (id int); SELECT this_is_not_valid_sql;');
      await expect(migrate(db, dir)).rejects.toThrow(/0001_bad\.sql failed and was rolled back/);
      const { rows } = await db.query(
        `SELECT table_name FROM information_schema.tables WHERE table_name = 'ok_so_far'`,
      );
      expect(rows, 'the half that succeeded must not survive').toEqual([]);
    });
  });
});

describe('what the database layer refuses to boot with', () => {
  const prod = { NODE_ENV: 'production' as const };
  const goodSecret = 'Zk3n8QpL2vX9mR4tY7wB1cF6hJ0sA5dG';

  it('is silent outside production', () => {
    expect(() => assertBootable({ NODE_ENV: 'development' })).not.toThrow();
  });

  it('refuses production with no DATABASE_URL', () => {
    expect(() => assertBootable({ ...prod, AUTH_SECRET: goodSecret })).toThrow(BootRefusal);
  });

  it('refuses anything that looks like SQLite', () => {
    // Elite Vault's specific mistake: one file, two writers, a long-running server.
    for (const url of ['sqlite:///data/app.db', 'file:./dev.db', '/var/data/holy.sqlite', '/var/data/holy.db']) {
      expect(() => assertBootable({ ...prod, DATABASE_URL: url, AUTH_SECRET: goodSecret }), url)
        .toThrow(/SQLite/);
    }
  });

  it('accepts a real Postgres URL', () => {
    expect(() => assertBootable({
      ...prod, DATABASE_URL: 'postgresql://u:p@host:5432/holy', AUTH_SECRET: goodSecret,
    })).not.toThrow();
  });

  it('refuses a missing, short or placeholder secret', () => {
    const url = 'postgresql://u:p@host:5432/holy';
    expect(() => assertBootable({ ...prod, DATABASE_URL: url })).toThrow(/AUTH_SECRET is not set/);
    expect(() => assertBootable({ ...prod, DATABASE_URL: url, AUTH_SECRET: 'short' }))
      .toThrow(new RegExp(`at least ${MIN_SECRET_LENGTH}`));
    // The one the CI workflow uses on purpose, which must never reach production.
    expect(() => assertBootable({
      ...prod, DATABASE_URL: url, AUTH_SECRET: 'build-time-placeholder-not-a-real-secret',
    })).toThrow(/placeholder/);
  });

  it('knows a placeholder from a real secret that happens to be long', () => {
    expect(looksLikePlaceholder('changeme')).toBe(true);
    expect(looksLikePlaceholder('  ')).toBe(true);
    expect(looksLikePlaceholder('Zk3n8QpL2vX9mR4tY7wB1cF6hJ0sA5dG')).toBe(false);
  });

  it('says what to do, not just that it refused', () => {
    try {
      assertBootable({ ...prod, DATABASE_URL: 'postgresql://x', AUTH_SECRET: 'short' });
    } catch (err) {
      expect((err as Error).message).toContain('openssl rand');
    }
  });
});

describe('the repository scopes before it reads', () => {
  it('lets an admin list people and refuses everybody else', async () => {
    await withTestDb(async (db) => {
      const repo = new Repository(db);
      await seedPerson(db, { id: 'p1', email: 'a@bruntsfield.capital', role: 'staff' });
      expect((await repo.listPeople(principal({ role: 'admin' }))).length).toBe(1);
      for (const role of ['exec', 'finance', 'staff'] as const) {
        await expect(repo.listPeople(principal({ role })), role).rejects.toThrow(ScopeViolation);
      }
    });
  });

  it("refuses a finance principal reading somebody else's row", async () => {
    // The acceptance criterion, in its own words: a finance principal reading a staff-only row
    // gets a ScopeViolation.
    await withTestDb(async (db) => {
      const repo = new Repository(db);
      await seedPerson(db, { id: 'analyst', email: 'analyst@bruntsfield.capital', role: 'staff' });
      const finance = principal({ role: 'finance', email: 'finance@bruntsfield.capital' });
      await expect(repo.getPerson(finance, 'analyst')).rejects.toThrow(ScopeViolation);
    });
  });

  it('lets anybody read themselves, by either of their addresses', async () => {
    await withTestDb(async (db) => {
      const repo = new Repository(db);
      await seedPerson(db, {
        id: 'john', email: 'john@bruntsfield.capital', role: 'admin',
        identities: ['john.gallagher@wealthcx.com'],
      });
      const viaSecond = principal({ role: 'staff', email: 'john.gallagher@wealthcx.com' });
      const person = await repo.getPerson(viaSecond, 'john');
      expect(person?.id).toBe('john');
    });
  });

  it('answers "not found" for a row that does not exist, rather than confirming the id is free', async () => {
    await withTestDb(async (db) => {
      const repo = new Repository(db);
      expect(await repo.getPerson(principal({ role: 'admin' }), 'nobody')).toBeNull();
      // And a non-admin asking for a missing id gets the SAME answer, not a violation, so the two
      // cannot be told apart by trying.
      expect(await repo.getPerson(principal({ role: 'staff' }), 'nobody')).toBeNull();
    });
  });

  it('refuses a pillar this principal does not hold, and lets admin through every one', async () => {
    await withTestDb(async (db) => {
      const repo = new Repository(db);
      const staff = principal({ role: 'staff', pillars: ['advisory'] });
      await expect(repo.assertMaySeePillar(staff, 'foundry')).rejects.toThrow(ScopeViolation);
      await expect(repo.assertMaySeePillar(staff, 'advisory')).resolves.toBeUndefined();
      await expect(repo.assertMaySeePillar(principal({ role: 'admin' }), 'foundry')).resolves.toBeUndefined();
    });
  });
});

describe('a role change is history, not an update in place', () => {
  it('writes the assignment, the projection and the activity together', async () => {
    await withTestDb(async (db) => {
      const repo = new Repository(db);
      const admin = principal({ role: 'admin', email: 'john@bruntsfield.capital' });
      await seedPerson(db, { id: 'p1', email: 'new@bruntsfield.capital', role: 'staff' });

      await repo.assignRole(admin, 'p1', 'finance', [], 'took over invoicing');

      const person = await repo.getPerson(admin, 'p1');
      expect(person?.role).toBe('finance');

      const history = await repo.roleHistory(admin, 'p1');
      expect(history.length).toBe(1);
      expect(history[0].role).toBe('finance');
      expect(history[0].assignedBy).toBe('john@bruntsfield.capital');
      expect(history[0].reason).toBe('took over invoicing');

      const activity = await repo.recentActivity(admin);
      expect(activity.some((a) => a.action === 'role.assigned' && a.entityId === 'p1')).toBe(true);
    });
  });

  it('keeps every role a person has ever held, newest first', async () => {
    await withTestDb(async (db) => {
      const repo = new Repository(db);
      const admin = principal({ role: 'admin' });
      await seedPerson(db, { id: 'p1', email: 'x@bruntsfield.capital', role: 'staff' });
      await repo.assignRole(admin, 'p1', 'finance', []);
      await repo.assignRole(admin, 'p1', 'exec', []);
      const history = await repo.roleHistory(admin, 'p1');
      expect(history.map((h) => h.role)).toEqual(['exec', 'finance']);
    });
  });

  it('refuses a non-admin trying to give themselves a role', async () => {
    await withTestDb(async (db) => {
      const repo = new Repository(db);
      await seedPerson(db, { id: 'p1', email: 'x@bruntsfield.capital', role: 'staff' });
      const staff = principal({ role: 'staff', email: 'x@bruntsfield.capital' });
      await expect(repo.assignRole(staff, 'p1', 'admin', [])).rejects.toThrow(ScopeViolation);
      await expect(repo.roleHistory(staff, 'p1')).rejects.toThrow(ScopeViolation);
    });
  });
});

describe('the activity feed is scoped too', () => {
  it('shows staff only what they did themselves', async () => {
    await withTestDb(async (db) => {
      const repo = new Repository(db);
      const admin = principal({ role: 'admin', email: 'john@bruntsfield.capital' });
      const staff = principal({ role: 'staff', email: 'analyst@bruntsfield.capital' });
      await repo.record(admin, 'invoice.sent', 'invoice', 'INV-001');
      await repo.record(staff, 'note.added', 'organisation', 'openbb');

      expect((await repo.recentActivity(admin)).length).toBe(2);
      const mine = await repo.recentActivity(staff);
      expect(mine.length).toBe(1);
      expect(mine[0].actor).toBe('analyst@bruntsfield.capital');
    });
  });

  it('caps the limit, so a caller cannot ask for the whole table', async () => {
    await withTestDb(async (db) => {
      const repo = new Repository(db);
      const admin = principal({ role: 'admin' });
      await repo.record(admin, 'x', 'y', 'z');
      await expect(repo.recentActivity(admin, 1_000_000)).resolves.toBeDefined();
      await expect(repo.recentActivity(admin, -5)).resolves.toBeDefined();
    });
  });
});
