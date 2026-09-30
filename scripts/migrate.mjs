#!/usr/bin/env node
/**
 * `npm run db:migrate` — apply pending migrations to whatever DATABASE_URL points at.
 *
 * Also run at boot (lib/db), so a deploy cannot reach a schema it was not built for. This script
 * exists for the times you want to do it deliberately and see what happened.
 */
import { Pool } from 'pg';
import { migrate } from '../lib/db/migrate.ts';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Nothing to migrate.');
  process.exit(2);
}

const pool = new Pool({ connectionString: url });
const db = { query: async (sql, params) => ({ rows: (await pool.query(sql, params)).rows }) };

try {
  const ran = await migrate(db);
  if (ran.length === 0) console.log('db:migrate — already up to date, nothing to apply.');
  else for (const name of ran) console.log(`db:migrate — applied ${name}`);
} catch (err) {
  console.error(`db:migrate — FAILED: ${err.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
