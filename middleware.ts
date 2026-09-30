/**
 * The signed-in gate. Nothing in Holy Corner is public except the four paths excluded below.
 *
 * Built from `auth.config.ts` and NOT from `auth.ts`: this bundles for the edge runtime, and
 * `auth.ts` pulls `node:crypto` through the password provider, which the edge bundle cannot carry.
 * The middleware only validates the session JWT and applies `authorized`; it never needs a provider.
 *
 * THIS IS AUTHENTICATION, NOT AUTHORIZATION. It answers "is somebody signed in". What that person
 * may see is `lib/authz.ts`, resolved per request, per page, before any row is read (CLAUDE.md #8).
 * A gate here and nothing there would be a product where every signed-in colleague sees everything.
 */
import NextAuth from 'next-auth';
import { baseConfig } from '@/auth.config';

export const { auth: middleware } = NextAuth(baseConfig);

export const config = {
  matcher: [
    // Exclusions are ANCHORED TO WHOLE SEGMENTS, so a look-alike path is still gated. A bare
    // `login` prefix would leave `/login-as-admin` public; `login$|login/` does not.
    //
    // `api/health$` is excluded and anchored, so Railway's health check gets a 200 rather than a
    // redirect to the sign-in page, while a future `/api/health-internal` stays gated.
    '/((?!api/auth/|api/health$|login$|login/|not-authorized$|not-authorized/|_next/static|_next/image|favicon.ico).*)',
  ],
};
