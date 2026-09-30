/**
 * Auth.js, the Node half: the providers, which may use Node-only modules.
 *
 * Three doors, and authorization is identical behind all of them (CLAUDE.md #8). Which door
 * somebody came through never changes what they may see.
 *
 *   - Google, the primary door. The Holy Corner vertical-login pattern (plan D8).
 *   - Email and password, present ONLY when `HC_PASSWORD_LOGINS` parses to at least one account.
 *     Unset, the provider does not exist and the login page renders exactly as it would have.
 *   - An end-to-end test provider, present only when `E2E_TEST_LOGIN=1` AND `E2E_TEST_LOGIN_SECRET`
 *     is set. A stray `E2E_TEST_LOGIN=1` in production is INERT, because with no secret the
 *     provider refuses everything. HC-006 drives the role cases through it.
 *
 * The gate and the callbacks live in `auth.config.ts`, which the edge middleware shares.
 */
import NextAuth, { type NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { baseConfig } from '@/auth.config';
import { authorizePassword, createThrottle, parsePasswordAccounts } from '@/lib/password-login';

const providers: NextAuthConfig['providers'] = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }),
];

const passwordConfig = parsePasswordAccounts(process.env.HC_PASSWORD_LOGINS);
for (const position of passwordConfig.malformed) {
  // POSITION ONLY, NEVER CONTENT. The likeliest malformation is a plaintext password pasted where
  // a hash belongs, and a log line is the last place a credential should surface.
  console.warn(
    `[auth] HC_PASSWORD_LOGINS entry ${position} is malformed (expected email=scrypt:...) and was ignored. ` +
      'Mint entries with scripts/mint-password-login.mjs.',
  );
}

export const passwordLoginEnabled = passwordConfig.accounts.size > 0;

if (passwordLoginEnabled) {
  const throttle = createThrottle();
  providers.push(
    Credentials({
      id: 'password',
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: (creds) =>
        authorizePassword(creds?.email, creds?.password, passwordConfig.accounts, throttle),
    }),
  );
}

const e2eSecret = process.env.E2E_TEST_LOGIN_SECRET;
if (process.env.E2E_TEST_LOGIN === '1' && e2eSecret) {
  providers.push(
    Credentials({
      id: 'e2e',
      name: 'End-to-end test login',
      credentials: { email: { label: 'Email', type: 'text' }, secret: { type: 'text' } },
      authorize: (creds) => {
        const secret = typeof creds?.secret === 'string' ? creds.secret : '';
        if (!e2eSecret || secret !== e2eSecret) return null;
        const email = typeof creds?.email === 'string' ? creds.email.trim() : '';
        return email ? { id: email, email, name: 'End-to-end test user' } : null;
      },
    }),
  );
}

export const config: NextAuthConfig = { ...baseConfig, providers };

export const { handlers, auth, signIn, signOut } = NextAuth(config);
