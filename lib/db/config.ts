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
  /** The end-to-end sign-in door. Both set means this is a test server, never a deployment. */
  readonly E2E_TEST_LOGIN?: string;
  readonly E2E_TEST_LOGIN_SECRET?: string;
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
 * Is this a real deployment, or merely a production BUILD?
 *
 * HC-004 keyed the refusal on `NODE_ENV === 'production'` and that is not the same question.
 * `next start` sets `NODE_ENV=production` for anything built for production, which includes the UI
 * gate, a reviewer running `npm run build && npm start` to look at a screen, and any local preview.
 * None of those is the live deployment, and none of them has a database.
 *
 * HC-006 found it by being unable to start a server at all. The first person to preview a
 * production build locally would have found it the same way, and would have had no idea why.
 *
 * The signal that actually separates them: **the end-to-end sign-in door**. HC-003 built it to
 * exist only when `E2E_TEST_LOGIN=1` AND `E2E_TEST_LOGIN_SECRET` is set, and documented in
 * `.env.example` that a real deployment sets neither. If that door is open, this is a test server.
 *
 * It is worth being explicit about the coupling this creates, rather than leaving it implied: if
 * somebody ever did set both of those on a real deployment, this check would stop demanding a
 * database. That would be the smaller of their two problems by a wide margin, because the open door
 * lets anybody holding the secret sign in as anybody at all. The check that matters there is
 * HC-007's deployment configuration, not this one.
 */
function isRealDeployment(env: BootEnv): boolean {
  if (env.NODE_ENV !== 'production') return false;
  const e2eDoorIsOpen = env.E2E_TEST_LOGIN === '1' && Boolean(env.E2E_TEST_LOGIN_SECRET?.trim());
  return !e2eDoorIsOpen;
}

/**
 * Check the environment, or throw with a message that says what to do.
 *
 * Only on a real deployment. Development and the UI gate run without a database on purpose and must
 * not be made impossible by rules that exist to protect the live service.
 */
export function assertBootable(env: BootEnv): void {
  if (!isRealDeployment(env)) return;

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
