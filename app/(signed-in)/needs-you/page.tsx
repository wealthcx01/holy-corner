import { NotYet } from '@/components/NotYet';
import { requireSection } from '@/lib/session';

export default async function NeedsYou() {
  // The gate. Same decision as the navigation, so the two cannot drift (lib/session.ts).
  const principal = await requireSection('/needs-you');

  return (
    <NotYet
      title="Needs you"
      ticket="HC-033"
      what="Every decision waiting on a person, from all three systems, in one queue. Each one says
            what it is, what saying yes does, what saying no does, and how long it has been waiting."
      role={principal.role}
    />
  );
}
