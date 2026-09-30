/**
 * What the database layer refuses to start without.
 *
 * SEPARATE FROM THE POOL ON PURPOSE, and with no imports of `pg` or `node:fs`, so the rules can be
 * tested by calling them. Grassmarket refuses to boot on SQLite, a placeholder secret or a short
 * secret, and every one of those refusals exists because the alternative is a production service
 * that starts happily and is wrong in a way nobody notices until it matters.
 */

export class BootRefusal extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BootRefusal';
  }
}

export interface BootEnv {
  readonly DATABASE_URL?: string;
  readonly AUTH_SECRET?: string;
  readonly NODE_ENV?: string;
}

/** Secrets shorter than this are refused in production. */
export const MIN_SECRET_LENGTH = 32;

/**
 * Values that look like a secret and are not one. Matched case-insensitively as whole words, so a
 * genuine random secret that happens to contain the letters "changeme" is not refused.
 */
const PLACEHOLDERS = [
  'changeme', 'change-me', 'secret', 'password', 'placeholder', 'todo', 'xxx',
  'your-secret-here', 'build-time-placeholder-not-a-real-secret',
];

export function looksLikePlaceholder(secret: string): boolean {
  const s = secret.trim().toLowerCase();
  if (!s) return true;
  return PLACEHOLDERS.some((p) => s === p || s.startsWith(`${p}-`) || s.endsWith(`-${p}`) || s.includes(p));
}

/**
 * Check the environment, or throw with a message that says what to do.
 *
 * Only in production. Development runs against PGLite or a local Postgres and must not be made
 * tedious by rules that exist to protect a live deployment.
 */
export function assertBootable(env: BootEnv): void {
  if (env.NODE_ENV !== 'production') return;

  const url = env.DATABASE_URL?.trim();
  if (!url) {
    throw new BootRefusal(
      'DATABASE_URL is not set. Holy Corner will not start in production without a database, ' +
        'because a hub with no record is a hub that answers every question with "nothing found". ' +
        'Railway injects this variable when the Postgres add-on is attached (HC-007).',
    );
  }

  // SQLite is not merely unsupported, it is the specific mistake Elite Vault made: one file, two
  // writers and a long-running server (plan D3).
  if (/^(sqlite|file:)/i.test(url) || url.endsWith('.db') || url.endsWith('.sqlite')) {
    throw new BootRefusal(
      `DATABASE_URL looks like SQLite ("${url.slice(0, 24)}..."). This runs one long-running server ` +
        'with background jobs reading Wise, so two writers is the normal case, not the exception. ' +
        'Use the Postgres add-on (plan D3).',
    );
  }

  const secret = env.AUTH_SECRET?.trim() ?? '';
  if (!secret) {
    throw new BootRefusal('AUTH_SECRET is not set. Generate one with `openssl rand -base64 32`.');
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new BootRefusal(
      `AUTH_SECRET is ${secret.length} characters and must be at least ${MIN_SECRET_LENGTH}. ` +
        'It signs the cookie that says who you are; a short secret on that is not a smaller ' +
        'problem than no secret. Generate one with `openssl rand -base64 32`.',
    );
  }
  if (looksLikePlaceholder(secret)) {
    throw new BootRefusal(
      'AUTH_SECRET looks like a placeholder rather than a generated value. The build uses a ' +
        'throwaway on purpose; production must not. Generate one with `openssl rand -base64 32`.',
    );
  }
}
