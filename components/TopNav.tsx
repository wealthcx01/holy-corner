'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { NavEntry } from '@/lib/nav';

/**
 * The top bar's navigation, and the drawer it becomes on a phone.
 *
 * WHY A DRAWER AT ALL. Five pills in a flex row is fine at 1440 and does not fit 393. Fountainbridge
 * shipped a 250px rail onto a 393px phone (FB-124) with lint, typecheck, 1,050 unit tests and the
 * build all green, because none of those things can see a screen. The drawer is here in the first
 * commit that has a navigation, rather than added later once somebody notices, and HC-006's UI gate
 * is what will keep it honest.
 *
 * It is a client component because it holds one piece of state: whether the drawer is open. That is
 * the only reason. Everything else about the shell renders on the server.
 */
export function TopNav({ entries, testId = 'topnav' }: { entries: readonly NavEntry[]; testId?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* The wide layout: every destination visible at once, which is what a top bar is for. */}
      <nav className="topnav topnav-wide" data-testid={testId} aria-label="Sections">
        {entries.map((e) => (
          <Link key={e.href} className="pill" href={e.href} title={e.blurb}>
            {e.label}
          </Link>
        ))}
      </nav>

      {/* The narrow layout. `aria-expanded` and `aria-controls` because a control that opens
          something has to say so to a screen reader; the icon alone says nothing. */}
      <button
        className="btn btn-ghost topnav-toggle"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="topnav-drawer"
        data-testid="topnav-toggle"
      >
        {open ? 'Close' : 'Sections'}
      </button>

      {/* Rendered only when open, so nothing is hiding off-screen adding to the page's scroll
          width. That is the exact defect FB-136 found: an element positioned outside a scroll
          container dragged a 393px page sideways by 92px. */}
      {open ? (
        <div className="topnav-drawer" id="topnav-drawer" data-testid="topnav-drawer">
          {entries.map((e) => (
            <Link key={e.href} className="topnav-drawer-link" href={e.href} onClick={() => setOpen(false)}>
              <span className="topnav-drawer-label">{e.label}</span>
              <span className="topnav-drawer-blurb">{e.blurb}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </>
  );
}
