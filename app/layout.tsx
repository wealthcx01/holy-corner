import './globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Source_Serif_4, Inter, IBM_Plex_Mono } from 'next/font/google';
import Link from 'next/link';
import { navFor, WORDMARK } from '@/lib/nav';
import { TopNav } from '@/components/TopNav';
import { currentResolution } from '@/lib/session';
import { signOut } from '@/auth';

// The three Bruntsfield typefaces, from one source. `next/font/google` self-hosts them at build
// time, so there is no second font source and no request to a third party on page load.
const serif = Source_Serif_4({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-source-serif' });
const sans = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono' });

export const metadata: Metadata = {
  title: 'Bruntsfield OS',
  description: 'The internal hub where Bruntsfield Capital sees the whole group in one place.',
};

// Usable on a phone from the first screen, not retrofitted.
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

/**
 * HC-002 rendered this shell for a hard-coded admin, as a named `STUB_ROLE` constant so it could
 * not be missed. HC-003 has removed it: the navigation is now the real signed-in person's, resolved
 * server-side on every request by `lib/authz.ts`.
 *
 * Three states, and the top bar is honest about each:
 *   - a principal: their sections, and a way to sign out.
 *   - signed in with no role: no sections at all, because there is nothing they may open. The bar
 *     still offers sign-out, so somebody who used the wrong account is not stuck.
 *   - signed out: the wordmark alone. Only `/login` and `/not-authorized` render in this state;
 *     everything else is redirected by the middleware before it reaches here.
 */
export default async function RootLayout({ children }: { children: ReactNode }) {
  const resolution = await currentResolution();
  const principal = resolution.kind === 'principal' ? resolution.principal : null;
  const signedIn = resolution.kind === 'principal' || resolution.kind === 'no-role';
  const entries = principal ? navFor(principal.role) : [];

  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <header className="topbar">
          <Link href="/" className="wordmark" aria-label="Bruntsfield OS home">
            <span className="wordmark-name">{WORDMARK.name}</span>
            <span className="wordmark-sub">{WORDMARK.sub}</span>
          </Link>
          {/* Fountainbridge puts an eyebrow here reading "Foundry Studio", beside a wordmark that
              reads "Bruntsfield / Foundry". Holy Corner's wordmark is "Bruntsfield / OS", so the
              same eyebrow would say "Bruntsfield OS" about four centimetres from where the wordmark
              already says it. Looking at the rendered bar is what caught it: the same three words
              appeared three times inside the top 180 pixels, counting the page heading. The eyebrow
              is the one that carries no information, so it is the one that goes. */}
          {entries.length > 0 ? <TopNav entries={entries} /> : null}
          {signedIn ? (
            <form
              className="topbar-account"
              data-testid="account-menu"
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
              }}
            >
              {/* The address is the title rather than the label: on a narrow bar a long address
                  either wraps the header or pushes the sections off the end, and neither is worth
                  it to show somebody the account they are already using. */}
              <button className="btn btn-ghost" type="submit" title={principal?.email ?? undefined}>
                {principal ? principal.role : 'no role'} · Sign out
              </button>
            </form>
          ) : null}
        </header>
        <main className="main">{children}</main>
      </body>
    </html>
  );
}
