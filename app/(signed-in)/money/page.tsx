import { NotYet } from '@/components/NotYet';
import { requireSection } from '@/lib/session';

export default async function Money() {
  // The gate. Same decision as the navigation, so the two cannot drift (lib/session.ts).
  const principal = await requireSection('/money');

  return (
    <NotYet
      title="Money"
      ticket="HC-014 to HC-020"
      what="What has been invoiced, what is owed to us and by when, what we owe, what has landed in
            the bank, and the margin on each deal once the consultant's share is taken off."
      role={principal.role}
    />
  );
}
