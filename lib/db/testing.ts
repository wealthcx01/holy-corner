import { PGlite } from '@electric-sql/pglite';
import { migrate, MIGRATIONS_DIR } from './migrate';
import type { Db } from './driver';

/**
 * A real Postgres, in memory, for one test.
 *
 * PGLite is Postgres compiled to WebAssembly, so THE SAME MIGRATION FILES AND THE SAME REPOSITORY
 * run here as in production. Not a mock and not a stub: a stubbed database tests the stub, and the
 * one thing worth knowing about a query is whether Postgres accepts it.
 *
 * No Postgres service in CI as a result. The whole suite runs in a plain Node job (HC-004).
 */

/**
 * PGLite runs a statement with parameters over the extended protocol, which allows exactly ONE
 * statement, and a migration file is many. `exec` uses the simple protocol and takes a script.
 * So: a script goes to `exec`, a parameterised statement goes to `query`. Getting this wrong shows
 * up as "cannot insert multiple commands into a prepared statement", which reads like a bug in the
 * migration rather than in the driver.
 */
function adapt(pg: PGlite): Db {
  return {
    async query(sql, params) {
      if (!params || params.length === 0) {
        const results = await pg.exec(sql);
        const last = results[results.length - 1];
        return { rows: (last?.rows ?? []) as Record<string, unknown>[] };
      }
      const res = await pg.query(sql, params as unknown[]);
      return { rows: (res.rows ?? []) as Record<string, unknown>[] };
    },
  };
}

export interface TestDb {
  readonly db: Db;
  close(): Promise<void>;
}

/** A migrated, empty database. Call `close()` when the test is done. */
export async function makeTestDb(): Promise<TestDb> {
  const pg = new PGlite();
  const db = adapt(pg);
  await migrate(db, MIGRATIONS_DIR);
  return { db, close: () => pg.close() };
}

/** The same, as a scope, so a test cannot leak an instance by throwing. */
export async function withTestDb<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  const { db, close } = await makeTestDb();
  try {
    return await fn(db);
  } finally {
    await close();
  }
}

/** Put a person in the record. Returns the id, so a test does not have to invent one twice. */
export async function seedPerson(
  db: Db,
  p: { id: string; email: string; displayName?: string; role: string; pillars?: string[]; identities?: string[] },
): Promise<string> {
  await db.query(
    `INSERT INTO people (id, email, display_name, role, pillars, identities)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [p.id, p.email.toLowerCase(), p.displayName ?? p.email, p.role, p.pillars ?? [], p.identities ?? []],
  );
  return p.id;
}
