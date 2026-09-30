import Link from 'next/link';
import { landingFor, navFor, type Role } from '@/lib/nav';

/**
 * A section that has a place in the navigation and nothing behind it yet.
 *
 * WHY THIS EXISTS AT ALL. The top bar offers five sections from this ticket onward, and four of
 * them are built later. Without these pages, every one of those links is a 404 — and Next.js
 * prefetches them, so the 404s happen on page load whether anyone clicks or not. That is
 * fountainbridge FB-124 precisely: *a dead nav row 404-ing on every page load*, shipped with every
 * automated gate green, and the reason CLAUDE.md #11 exists.
 *
 * The alternative was to hide the four links until their tickets land. That is worse. The sections
 * ARE the shape of this product, a reader should be able to see where things will be, and a
 * navigation that grows an item at a time never gets looked at as a whole.
 *
 * So the links work, and the page they reach says plainly what is not built and which ticket
 * builds it. A person is never told "not found" about a section the product just offered them.
 */
export function NotYet({
  title,
  ticket,
  what,
  role,
}: {
  title: string;
  ticket: string;
  what: string;
  role: Role;
}) {
  // The way back has to be somewhere this person can actually go. It read "Back to the group" for
  // everybody until a staff account was screenshotted: staff cannot open the group, so the link
  // bounced them to their own landing page while claiming to do something else. A link that does
  // not do what it says is the dead-control problem wearing a label.
  const back = landingFor(role);
  // Lower-cased because it sits mid-sentence. "Back to The group" is a capital letter in the
  // middle of a phrase; sentence case is the house rule (docs/STYLE-VOICE.md rule 5).
  const label = navFor(role).find((e) => e.href === back)?.label ?? 'your work';
  const backLabel = label.charAt(0).toLowerCase() + label.slice(1);

  return (
    <div className="measure">
      <p className="eyebrow">Not built yet</p>
      <h1>{title}</h1>
      <p>{what}</p>
      <div className="callout callout-info">
        This section arrives in <strong>{ticket}</strong>. The link is here now so the whole shape of
        the product is visible from the first screen, rather than appearing one item at a time.
      </div>
      <p>
        <Link href={back}>Back to {backLabel}</Link>
      </p>
    </div>
  );
}
