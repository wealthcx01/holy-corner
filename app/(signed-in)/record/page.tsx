import { NotYet } from '@/components/NotYet';
import { requireSection } from '@/lib/session';

/** This section's path, named once so the gate and the way back cannot disagree. */
const SECTION = '/record';

export default async function Record() {
  // The gate. Same decision as the navigation, so the two cannot drift (lib/session.ts).
  const principal = await requireSection(SECTION);

  return (
    <NotYet
      title="The record"
      ticket="HC-010 to HC-013"
      what="Every organisation Bruntsfield deals with, the people at them, the contracts signed with
            them, and what those contracts actually say, as terms a person can read rather than a
            PDF somebody has to open."
      role={principal.role}
      href={SECTION}
    />
  );
}
