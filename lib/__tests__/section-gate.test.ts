import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { landingFor, navFor, ROLES, seesGroupLedger } from '../nav';

/**
 * Every page behind the sign-in must gate itself, and the gate must agree with the navigation.
 *
 * This test exists because HC-003 shipped the navigation first and the gate second, and in between
 * it had a product where `finance` was not offered "The group" and could read it by typing the
 * URL, and `staff` could read Money the same way. The rendered nav was correct in every case,
 * which is exactly what made it convincing.
 *
 * A future page added under `app/(signed-in)/` without a `requireSection` call is that defect
 * returning. Nothing about writing a new page would remind anybody, so this does.
 */

const GROUP = join(import.meta.dirname, '..', '..', 'app', '(signed-in)');

function pageFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) pageFiles(full, out);
    else if (entry === 'page.tsx') out.push(full);
  }
  return out;
}

describe('every page behind the sign-in gates itself', () => {
  const files = pageFiles(GROUP);

  it('finds the pages at all, so a moved directory fails loudly', () => {
    expect(files.length).toBeGreaterThanOrEqual(5);
  });

  it('gates itself: every page but the root calls requireSection with its own route', () => {
    const missing: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      const rel = file.slice(GROUP.length).replace(/\\/g, '/').replace(/\/page\.tsx$/, '');
      const href = rel === '' ? '/' : rel;
      if (href === '/') continue; // the root routes by role instead; its own test is below
      if (!src.includes(`requireSection('${href}')`)) missing.push(`${href} (${file.split('/').slice(-2).join('/')})`);
    }
    expect(missing, `these pages do not gate themselves:\n  - ${missing.join('\n  - ')}`).toEqual([]);
  });

  it('the root routes by role rather than being left open', () => {
    // The root is the one page that redirects instead of refusing, because everybody lands here
    // after signing in and a refusal would make signing in produce a 404. It still must not simply
    // render for anyone: it has to ask who this is and where they belong.
    const src = readFileSync(join(GROUP, 'page.tsx'), 'utf8');
    expect(src).toContain('currentPrincipal');
    expect(src).toContain('seesGroupLedger');
    expect(src).toContain('landingFor');
  });

  it('every role lands somewhere it is actually allowed', () => {
    for (const role of ROLES) {
      const target = landingFor(role);
      const allowed = navFor(role).map((e) => e.href);
      expect(allowed, `${role} lands on ${target}, which it may not open`).toContain(target);
    }
  });

  it('only admin and exec get the group ledger at the root', () => {
    expect(seesGroupLedger('admin')).toBe(true);
    expect(seesGroupLedger('exec')).toBe(true);
    expect(seesGroupLedger('finance')).toBe(false);
    expect(seesGroupLedger('staff')).toBe(false);
  });

  it('every gated route is a route some role is actually offered', () => {
    // Catches the other direction: a page gated on a route that appears in no role's navigation is
    // a page nobody can ever reach, which is dead code wearing a lock.
    const offered = new Set(ROLES.flatMap((r) => navFor(r).map((e) => e.href)));
    for (const file of files) {
      const rel = file.slice(GROUP.length).replace(/\\/g, '/').replace(/\/page\.tsx$/, '');
      const href = rel === '' ? '/' : rel;
      expect(offered.has(href), `${href} is gated but no role is offered it`).toBe(true);
    }
  });

  it('every route some role is offered has a page behind it', () => {
    // And the third direction: a link in the navigation with no page is FB-124's dead nav row,
    // which HC-002 had to fix once already.
    const hrefs = new Set(
      files.map((f) => {
        const rel = f.slice(GROUP.length).replace(/\\/g, '/').replace(/\/page\.tsx$/, '');
        return rel === '' ? '/' : rel;
      }),
    );
    for (const role of ROLES) {
      for (const entry of navFor(role)) {
        expect(hrefs.has(entry.href), `${role} is offered ${entry.href} and no page serves it`).toBe(true);
      }
    }
  });
});
