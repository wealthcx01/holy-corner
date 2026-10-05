import { NotYet } from '@/components/NotYet';
import { requireSection } from '@/lib/session';

/** This section's path, named once so the gate and the way back cannot disagree. */
const SECTION = '/what-happened';

export default async function WhatHappened() {
  // The gate. Same decision as the navigation, so the two cannot drift (lib/session.ts).
  const principal = await requireSection(SECTION);

  return (
    <NotYet
      title="What happened"
      ticket="HC-034"
      what="One dated list of everything that happened across the group: a contract signed, an
            invoice paid, an approval granted in a studio, a consultant promoted. Newest first."
      role={principal.role}
      href={SECTION}
    />
  );
}
