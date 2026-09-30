import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Db } from './driver';

export const MIGRATIONS_DIR = join(process.cwd(), 'db', 'migrations');

/**
 * Apply every migration that has not been applied yet.
 *
 * Elite Vault's `db/index.ts` did this on connect from a `_migrations` table, and it is the one
 * piece of its data layer worth keeping: nobody has to remember to run anything, and a deploy
 * cannot reach a schema it was not built for.
 *
 * IDEMPOTENT BY CONSTRUCTION. A migration that has a row in `_migrations` is skipped, and each one
 * runs inside a transaction with its bookkeeping row, so a migration that fails half way leaves
 * neither half of itself behind. There is no "partly applied" state to reason about at three in the
 * morning.
 *
 * Migrations are applied in FILENAME ORDER, which is why they are numbered.
 */
export async function migrate(db: Db, dir: string = MIGRATIONS_DIR): Promise<string[]> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name        text PRIMARY KEY,
      applied_at  timestamptz NOT NULL DEFAULT now()
    )
  `);

  const applied = new Set(
    (await db.query('SELECT name FROM _migrations')).rows.map((r) => String(r.name)),
  );

  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  const ran: string[] = [];

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(dir, file), 'utf8');
    // The migration and the record that it ran are ONE transaction. Apart, a crash between them
    // leaves a schema change that the next boot tries to apply again.
    await db.query('BEGIN');
    try {
      await db.query(sql);
      await db.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      await db.query('COMMIT');
      ran.push(file);
    } catch (err) {
      await db.query('ROLLBACK');
      throw new Error(`Migration ${file} failed and was rolled back: ${(err as Error).message}`, { cause: err });
    }
  }

  return ran;
}
