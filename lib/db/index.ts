import 'server-only';
import { Pool } from 'pg';
import { assertBootable } from './config';
import type { Db } from './driver';

export { assertBootable, BootRefusal } from './config';
export type { Db, QueryResult } from './driver';
export { migrate, MIGRATIONS_DIR } from './migrate';

/**
 * The connection pool. ONE per process.
 *
 * Next.js re-evaluates modules on every hot reload in development, so a pool created at module
 * scope leaks a new one each time until Postgres refuses the connection. Stashed on `globalThis`
 * for the same reason every Next.js database guide does it, and with the reason written down so
 * nobody "tidies" it away.
 */
const globalForPool = globalThis as unknown as { holyCornerPool?: Pool };

export function pool(): Pool {
  if (!globalForPool.holyCornerPool) {
    assertBootable(process.env);
    globalForPool.holyCornerPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Railway's Postgres terminates idle connections; a pool that does not expect that hands out
      // a dead one and the first query of the morning fails for no visible reason.
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return globalForPool.holyCornerPool;
}

/** The application's database handle, as the repository sees it. */
export function db(): Db {
  const p = pool();
  return {
    async query(sql, params) {
      const res = await p.query(sql, params as unknown[]);
      return { rows: res.rows as Record<string, unknown>[] };
    },
  };
}
