import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { currentResolution } from '@/lib/session';

/**
 * THE AUTHORIZATION GATE. Every page that shows anything at all is a child of this layout.
 *
 * ## Why this exists as a route group rather than a check in each page
 *
 * HC-003 first computed the principal, rendered the right navigation for each role, and stopped
 * there. Every role got the correct set of links. It was still wrong, and running it is what showed
 * that:
 *
 *   - a `@bruntsfield.capital` account with NO ROLE reached `/` and read the page.
 *   - a `@gmail.com` account, which `resolvePrincipal` refuses outright, got a session, reached
 *     `/`, and read the page.
 *
 * The decision was being computed and then not acted on. `lib/nav.ts` says in its own comment that
 * a nav which hides a link is not a permission system and nothing should ever be mistaken for one;
 * the first build did precisely that.
 *
 * A guard in each page would work and would be forgotten, which is the same defect with a longer
 * fuse. A route group cannot be forgotten: a new page under `app/(signed-in)/` inherits this layout
 * by existing, and a page put outside it is a deliberate act visible in the diff.
 *
 * The middleware is NOT this. It answers "is somebody signed in" at the edge, where it cannot read
 * a role. This answers "may this person see anything", which is the question that matters.
 *
 * ## And this is still not the last line
 *
 * CLAUDE.md #8 puts scoping in the repository layer, before any row is read. This gate stops a
 * person with no role at the door; `assertPillar` and `requireRole` stop a person with the wrong
 * role reaching a particular record, and HC-004 puts those inside the repository so that a route
 * which forgets to call them still cannot read another pillar's data.
 */
export default async function SignedInLayout({ children }: { children: ReactNode }) {
  const resolution = await currentResolution();

  if (resolution.kind === 'no-role' || resolution.kind === 'refused') {
    // Both go to the same page, which tells each of them a different thing. Not to `/login`: a
    // refused identity still holds a valid session cookie, and `/login` sends a signed-in visitor
    // to `/`, so the two would bounce off each other forever.
    redirect('/not-authorized');
  }

  return <>{children}</>;
}
