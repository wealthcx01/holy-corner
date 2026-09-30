/**
 * What each person sees in the top bar.
 *
 * The nav is a FUNCTION OF ROLE from the first commit, not a fixed list that HC-003 will later
 * come back and make conditional. Fountainbridge's header shipped with eight fixed entries and was
 * cut to four in FB-067, after a walkthrough found three of them - Ventures, Workstreams, Foundry -
 * sitting next to each other and impossible to tell apart from the words. They described how the
 * software was organised rather than what a person came to do.
 *
 * So these five are named for the job, and the labels match the page headings they lead to, so
 * somebody who clicks a word arrives somewhere that uses the same word.
 *
 * HC-003 supplies the real principal. Until it lands, the layout passes a stub and every entry
 * renders, because a shell with no navigation tells you nothing about whether the shell works.
 */
import { offendingWords } from './glossary';

/** The four roles from the plan (D8). HC-003 resolves a signed-in person to one of them. */
export const ROLES = ['admin', 'exec', 'finance', 'staff'] as const;
export type Role = (typeof ROLES)[number];

export interface NavEntry {
  readonly href: string;
  readonly label: string;
  /** Why this entry exists, in the words a reader would use. Rendered as the link's title. */
  readonly blurb: string;
}

const ALL: readonly NavEntry[] = [
  { href: '/', label: 'The group', blurb: 'Every vertical on one screen, coloured by whose attention it needs' },
  { href: '/record', label: 'The record', blurb: 'Organisations, people, contracts and what they say' },
  { href: '/money', label: 'Money', blurb: 'Invoices, what is owed to us, what we owe, and the bank' },
  { href: '/needs-you', label: 'Needs you', blurb: 'Every decision waiting on a person, across the group' },
  { href: '/what-happened', label: 'What happened', blurb: 'One activity feed across every vertical' },
] as const;

/**
 * The nav for a role.
 *
 * `finance` does not see "The group". That is the plan's rule (D8 and HC-003's scope), and it is
 * not cosmetic: the group ledger is the cross-vertical executive view, and a finance principal is
 * scoped to money. Hiding the link is the courtesy; the SERVER refuses the route either way
 * (CLAUDE.md #8, scoping happens in the repository layer before any row is read). A nav that hides
 * a link is not a permission system, and nothing here should ever be mistaken for one.
 */
export function navFor(role: Role): readonly NavEntry[] {
  switch (role) {
    case 'admin':
    case 'exec':
      return ALL;
    case 'finance':
      return ALL.filter((e) => e.href !== '/');
    case 'staff':
      // Scoped to their own pillar's record and the queue that names them. HC-003 narrows this
      // further once a staff principal carries its pillars.
      return ALL.filter((e) => e.href === '/record' || e.href === '/needs-you');
    default: {
      // A role added to the contract without a nav decision is a BUILD error, not a blank header.
      const exhaustive: never = role;
      return exhaustive;
    }
  }
}

/** The wordmark, in two lines. The eyebrow style grassmarket uses for "ADVISORY". */
export const WORDMARK = { name: 'Bruntsfield', sub: 'OS' } as const;

/** Guards the vocabulary at the one place every reader looks (HC-009 makes this a CI job). */
export function navUsesPlainEnglish(entries: readonly NavEntry[] = ALL): string[] {
  return entries.filter((e) => offendingWords(`${e.label} ${e.blurb}`).length > 0).map((e) => e.label);
}

/**
 * Where a role lands after signing in.
 *
 * THE ROOT IS SPECIAL and does not follow the 404 rule the other sections do. `/` holds the group
 * ledger, which only `admin` and `exec` may read, but it is also where every sign-in arrives. The
 * first build refused it for `finance` and `staff`, correctly by the section rule, and the result
 * was that signing in as either of them produced a 404 page. Found by screenshotting the four
 * roles: their heights came back 1,188px instead of 1,000px, because the picture was of an error.
 *
 * HC-030 settles it in words: "`finance` lands on **Money**; `staff` on their pillar; only `admin`
 * and `exec` see the ledger". So the root REDIRECTS rather than refusing, and it redirects to the
 * first section that role actually has, which is `navFor`'s answer and not a second list.
 *
 * Redirecting leaks nothing. It says where this person can go, not what is on the page they cannot.
 */
export function landingFor(role: Role): string {
  switch (role) {
    case 'admin':
    case 'exec':
      return '/';
    // NAMED, not derived from the first entry in the navigation. HC-030 says "finance lands on
    // Money", and the first entry finance holds is The record, so deriving it sent them to the
    // wrong place. The order of the navigation is a reading order; where somebody starts work is a
    // separate decision and the plan makes it.
    case 'finance':
      return '/money';
    case 'staff':
      return '/record';
    default: {
      const exhaustive: never = role;
      return exhaustive;
    }
  }
}

/** Does this role get the group ledger at the root? */
export function seesGroupLedger(role: Role): boolean {
  return navFor(role).some((e) => e.href === '/');
}
