/**
 * Runs once when the server starts, before it serves anything. ONE job: refuse a broken
 * configuration.
 *
 * In production, no `DATABASE_URL`, a SQLite-shaped one, or a missing, short or placeholder
 * `AUTH_SECRET` stops the boot with a message that says what to do. A service that starts happily
 * on a broken configuration is one that is wrong in a way nobody notices until it matters.
 *
 * ## Why the migrations are NOT here
 *
 * They were, and it broke the build. Next traces this file for BOTH runtimes, and the edge runtime
 * has no `fs`, no `path` and no TCP sockets, so bundling the Postgres driver for it fails with
 * "Can't resolve 'fs'" pointing inside `pg-connection-string`. The `NEXT_RUNTIME === 'nodejs'`
 * guard does not help: the guard runs at runtime and the trace happens at build time, and
 * `serverExternalPackages` does not reach the edge compilation.
 *
 * So migrations run in the START COMMAND instead: `npm run db:migrate && npm run start`, in
 * `railway.json`. That is still "at boot" in the only sense that matters - the server cannot serve
 * a request against a schema it was not built for, because it does not start until the migration
 * succeeds - and it is better in two ways. A failed migration stops the deploy with the migration's
 * own error rather than a health check timing out, and the Postgres driver never enters the Next
 * bundle at all.
 *
 * It is also what grassmarket does, which is why HC-007 notes that its health check timeout is
 * raised to 300 seconds: a boot that migrates first takes longer to answer.
 *
 * `lib/db/config.ts` is imported here and imports nothing itself. That is deliberate and it is why
 * this check can live in a file both runtimes compile.
 */
export async function register() {
  const { assertBootable } = await import('./lib/db/config');
  // Throws, and is MEANT to. A refusal here stops the deploy, which is the point: the log names
  // the variable and says what to do.
  assertBootable(process.env);
}
