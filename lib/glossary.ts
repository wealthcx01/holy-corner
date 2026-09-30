/**
 * The words Holy Corner uses on a screen, and the words it refuses to.
 *
 * CLAUDE.md #12: some readers are not technical and none of them should have to be. The Executive
 * Management team will read these screens; so will Finance. Neither should have to know what the
 * two studios are called internally, or what AR and AP stand for.
 *
 * This module is the vocabulary. HC-009 turns the checkable half of it into `copy-lint`, a CI job,
 * because the copy in both sibling studios was fixed by hand several times and kept regressing.
 * Until then this is the reference a reviewer reads.
 */

/** A word we use, the word we are avoiding, and why. The `why` is not decoration: it is what stops
 *  the next person "tidying" the vocabulary back to the jargon. */
export interface Term {
  readonly use: string;
  /**
   * The words we avoid. LOWER CASE ONLY, and never two casings of the same word: matching is
   * case-insensitive, so listing "Grassmarket" beside "grassmarket" reports one mistake twice.
   */
  readonly notThis: readonly string[];
  readonly why: string;
}

export const GLOSSARY: readonly Term[] = [
  {
    use: 'the Advisory Studio',
    notThis: ['grassmarket', 'GM'],
    why: 'Codenames are for repositories. A pillar lead reading a screen has no reason to know one.',
  },
  {
    use: 'the Foundry Studio',
    notThis: ['fountainbridge', 'FB'],
    why: 'Same reason. The studio has a name people already use in conversation.',
  },
  {
    use: 'the record',
    notThis: ['the database', 'the DB', 'the datastore'],
    why: 'What it holds is a commercial record. How it is stored is nobody else’s concern.',
  },
  {
    use: 'Needs you',
    notThis: ['pending approvals', 'approval queue', 'action items'],
    why: 'It says who has to do something. "Pending" says only that time is passing.',
  },
  {
    use: 'owed to us',
    notThis: ['AR', 'accounts receivable', 'debtors'],
    why: 'Three words a reader already knows, instead of two letters they have to be taught.',
  },
  {
    use: 'we owe',
    notThis: ['AP', 'accounts payable', 'creditors'],
    why: 'The same, in the other direction.',
  },
  {
    use: 'sent',
    notThis: ['dispatched', 'transmitted', 'egressed'],
    why: 'The plain word. An invoice is sent.',
  },
  {
    use: 'a person approved it',
    notThis: ['human-in-the-loop', 'HITL', 'manual review'],
    why: 'Naming the actor is the whole point of the gate. A person did this, and we know which one.',
  },
  {
    use: 'AI-drafted',
    notThis: ['AI-generated', 'auto-generated', 'synthesised'],
    why: 'A draft is waiting for somebody. "Generated" sounds finished, and nothing here is finished until it is accepted.',
  },
  {
    use: 'could not be read',
    notThis: ['N/A', 'error', 'unavailable', '—'],
    why: 'Fountainbridge FB-136: a source that failed is not a calm state. Say it in words, so nobody reads a dash as "nothing to see".',
  },
] as const;

/** Every word this product does not put on a screen, flattened for HC-009's lint. */
export const BANNED_WORDS: readonly string[] = GLOSSARY.flatMap((t) => t.notThis);

/** The preferred word for a banned one, or null when it is not in the vocabulary. */
export function preferredFor(word: string): string | null {
  const needle = word.trim().toLowerCase();
  return GLOSSARY.find((t) => t.notThis.some((n) => n.toLowerCase() === needle))?.use ?? null;
}

/**
 * Does this text use a word we do not put on a screen? Returns the offending words.
 *
 * MATCHED ON WORD BOUNDARIES, NOT AS SUBSTRINGS, and that is not a detail. The first version of
 * this used `includes()`, and the very first text it was run against - the navigation label "What
 * happened" - was reported as using "AP", because "happened" contains those two letters. A check
 * that reports the wrong reason is one people learn to skim, and a skipped check protects nothing
 * (the same lesson `lib/ticket-drift.ts` was built on).
 *
 * Two-letter abbreviations are exactly where a substring match goes wrong, and "AR" and "AP" are
 * two of the ten entries here. HC-009 inherits this function; it must not inherit the bug.
 */
export function offendingWords(text: string): string[] {
  const found = new Set<string>();
  for (const term of GLOSSARY) {
    for (const banned of term.notThis) {
      // Escape the term, then require a boundary on each side. `\b` is wrong next to a non-word
      // character, so the guards are written out rather than assumed.
      const escaped = banned.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`, 'iu').test(text)) found.add(banned);
    }
  }
  return [...found];
}
