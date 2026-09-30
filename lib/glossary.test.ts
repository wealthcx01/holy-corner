import { describe, expect, it } from 'vitest';
import { BANNED_WORDS, GLOSSARY, offendingWords, preferredFor } from './glossary';

describe('the words this product does not put on a screen', () => {
  it('matches on word boundaries, not substrings', () => {
    // The regression that produced this test: "What happened" contains the letters "ap", and the
    // first version of the check reported the navigation label as using the abbreviation for
    // accounts payable. A check that cites the wrong reason is one people learn to skim.
    expect(offendingWords('What happened')).toEqual([]);
    expect(offendingWords('Every vertical, coloured by whose attention it needs')).toEqual([]);
    expect(offendingWords('Invoices, what is owed to us, what we owe, and the bank')).toEqual([]);
  });

  it('still catches the abbreviation when it is actually used as a word', () => {
    expect(offendingWords('AP ageing by currency')).toEqual(['AP']);
    expect(offendingWords('the AR ledger')).toEqual(['AR']);
  });

  it('catches a studio codename', () => {
    expect(offendingWords('read from grassmarket')).toEqual(['grassmarket']);
    expect(offendingWords('the fountainbridge connector')).toEqual(['fountainbridge']);
  });

  it('is case-insensitive', () => {
    expect(offendingWords('GRASSMARKET')).toEqual(['grassmarket']);
  });

  it('does not fire on a word that merely contains a banned one', () => {
    // "error" is banned as an empty-state word; "terror", "mirrored" and "errors" must not trip it.
    for (const safe of ['mirrored', 'terror', 'Dispatcher']) {
      expect(offendingWords(safe)).toEqual([]);
    }
  });

  it('points at the word to use instead', () => {
    expect(preferredFor('grassmarket')).toBe('the Advisory Studio');
    expect(preferredFor('AR')).toBe('owed to us');
    expect(preferredFor('a word nobody banned')).toBeNull();
  });

  it('every entry explains itself, so nobody tidies the vocabulary back to jargon', () => {
    for (const t of GLOSSARY) {
      expect(t.why.length).toBeGreaterThan(20);
      expect(t.notThis.length).toBeGreaterThan(0);
    }
    expect(BANNED_WORDS.length).toBeGreaterThan(20);
  });
});

describe('the vocabulary data itself', () => {
  it('lists no word twice in different casings', () => {
    // Matching is case-insensitive, so two casings report one mistake twice. Found by the tests
    // above, which expected one offender and got two.
    const seen = new Map<string, string>();
    for (const t of GLOSSARY) {
      for (const w of t.notThis) {
        const key = w.toLowerCase();
        expect(seen.has(key), `"${w}" duplicates "${seen.get(key)}"`).toBe(false);
        seen.set(key, w);
      }
    }
  });

  it('does not flag a ticket id that merely starts with a banned abbreviation', () => {
    // "FB" is banned as a studio codename. "FB-124" is a ticket reference and must pass, because
    // tickets and pull request bodies are read by the same lint in HC-009.
    expect(offendingWords('see fountainbridge FB-124 for the reason')).toEqual(['fountainbridge']);
  });
});
