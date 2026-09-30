/**
 * The edge-safe half of Auth.js. Ported from fountainbridge's FB-092 split.
 *
 * `middleware.ts` bundles for the EDGE runtime, where `node:crypto` cannot go, and the password
 * provider needs `node:crypto` for scrypt. So the middleware builds its gate from THIS file, which
 * carries no providers at all, and `auth.ts` spreads it and adds the real providers for the Node
 * runtime.
 *
 * That works because the middleware never signs anybody in. It validates a session JWT that was
 * signed with `AUTH_SECRET`, the same secret on both sides, and applies `authorized`. Signing in
 * always happens in the Node runtime, through `app/api/auth`.
 */
import type { NextAuthConfig } from 'next-auth';

export const baseConfig = {
  // Deployed on Railway, not Vercel (plan D3). Without this Auth.js returns a 500 rather than a
  // sign-in page, and the error does not say why.
  trustHost: true,
  providers: [],
  pages: { signIn: '/login' },
  callbacks: {
    /**
     * The gate. Every matched route requires a signed-in user.
     *
     * NOT OPTIONAL, and not a default. Without this callback, Auth.js v5 middleware treats every
     * request as authorized and lets the whole product through. Holy Corner is the admin hub for
     * the group; there is no page here that is safe to serve to nobody.
     */
    authorized({ auth }) {
      return !!auth?.user;
    },
    /**
     * The JWT carries the EMAIL AND NOTHING ELSE. No role, no pillars.
     *
     * Deliberate, and grassmarket's rule (GRS-0208): "the principal is rebuilt per request from the
     * subject's stored row, so a role change or a deleted account takes effect immediately instead
     * of living on inside an issued token." A role baked into a token is a role that keeps working
     * after somebody revokes it, for as long as the token lives.
     *
     * So `lib/authz.ts` resolves the role on every request, from the allowlist and the role source.
     * That costs one map lookup today and one indexed query after HC-004.
     */
    jwt({ token, user }) {
      if (user?.email) token.email = user.email;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.email) session.user.email = token.email;
      return session;
    },
  },
} satisfies NextAuthConfig;
