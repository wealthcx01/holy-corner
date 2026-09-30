import { describe, expect, it } from 'vitest';
import { navFor, navUsesPlainEnglish, ROLES, WORDMARK } from './nav';

describe('what each role sees in the top bar', () => {
  it('gives an admin and an exec the whole group', () => {
    for (const role of ['admin', 'exec'] as const) {
      expect(navFor(role).map((e) => e.label)).toEqual([
        'The group', 'The record', 'Money', 'Needs you', 'What happened',
      ]);
    }
  });

  it('does not offer finance the group ledger', () => {
    const labels = navFor('finance').map((e) => e.label);
    expect(labels).not.toContain('The group');
    expect(labels).toContain('Money');
  });

  it('gives staff only their record and their queue', () => {
    expect(navFor('staff').map((e) => e.label)).toEqual(['The record', 'Needs you']);
  });

  it('never returns an empty nav for any role in the contract', () => {
    // A header with no links reads as a broken page, not as a permission decision.
    for (const role of ROLES) expect(navFor(role).length).toBeGreaterThan(0);
  });

  it('every entry has a destination and a plain-language reason', () => {
    for (const role of ROLES) {
      for (const entry of navFor(role)) {
        expect(entry.href.startsWith('/')).toBe(true);
        expect(entry.blurb.length).toBeGreaterThan(10);
      }
    }
  });
});

describe('the vocabulary on the one surface every reader sees', () => {
  it('names no studio by its codename and no accounting abbreviation', () => {
    expect(navUsesPlainEnglish()).toEqual([]);
  });

  it('catches a codename if one is ever added', () => {
    const bad = [{ href: '/x', label: 'grassmarket', blurb: 'the advisory studio pipeline view' }];
    expect(navUsesPlainEnglish(bad)).toEqual(['grassmarket']);
  });

  it('the wordmark is two lines, so the eyebrow has something to sit under', () => {
    expect(WORDMARK.name).toBe('Bruntsfield');
    expect(WORDMARK.sub).toBe('OS');
  });
});
