import './globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Source_Serif_4, Inter, IBM_Plex_Mono } from 'next/font/google';
import Link from 'next/link';
import { navFor, WORDMARK, type Role } from '@/lib/nav';
import { TopNav } from '@/components/TopNav';

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
 * The stub principal.
 *
 * HC-003 replaces this with the signed-in person, resolved by `lib/authz.ts`. Until then the shell
 * renders as an admin, because a shell with no navigation tells you nothing about whether the shell
 * works, and the point of this ticket is a shell somebody can look at.
 *
 * It is a named constant rather than an inline literal SO THAT IT IS GREPPABLE. An HC-003 that
 * misses one of these leaves a screen permanently signed in as an administrator, which is the kind
 * of thing that is obvious in a diff and invisible in a running app.
 */
const STUB_ROLE: Role = 'admin';

export default function RootLayout({ children }: { children: ReactNode }) {
  const entries = navFor(STUB_ROLE);

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
          <TopNav entries={entries} />
          {/* The account menu is a placeholder until HC-003 has an account to show. It says so in
              words rather than rendering an empty control, because a control that does nothing is
              worse than one that is not there (design contract: no dead UI). */}
          <span className="topbar-account" data-testid="account-menu-placeholder">
            Sign-in arrives with HC-003
          </span>
        </header>
        <main className="main">{children}</main>
      </body>
    </html>
  );
}
