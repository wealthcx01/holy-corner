/**
 * The one thing the repository needs from a database: run this statement, give me rows.
 *
 * Deliberately tiny, and it exists so the SAME MIGRATIONS AND THE SAME REPOSITORY run against
 * Postgres in production and PGLite in tests. Not an ORM and not a query builder: SQL lives in
 * `lib/data/repository.ts` and nowhere else (CLAUDE.md, plan D3), so an abstraction over SQL would
 * be a second place to look.
 *
 * No `server-only` import here, because the PGLite test helper imports it outside a server bundle.
 */
export interface QueryResult {
  readonly rows: Record<string, unknown>[];
}

export interface Db {
  query(sql: string, params?: readonly unknown[]): Promise<QueryResult>;
}
