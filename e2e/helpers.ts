import { expect, type Page } from '@playwright/test';
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The shared machinery for the UI gate (HC-006).
 *
 * Two jobs: sign in as a role without a live Google client, and take a numbered screenshot that
 * lands in the gallery a person actually opens.
 */

export const SHOTS = 'e2e/__screenshots__';

/** The four roles, and the address the gate signs in as for each. Matches playwright.config.ts. */
export const CAST = {
  admin: 'john@bruntsfield.capital',
  exec: 'exec@bruntsfield.capital',
  finance: 'finance@bruntsfield.capital',
  staff: 'analyst@bruntsfield.capital',
} as const;

export type Role = keyof typeof CAST;

/** Signed in on a Bruntsfield account nobody has given a role to. A normal state, not an error. */
export const NO_ROLE = 'newcolleague@bruntsfield.capital';

/** Not a Bruntsfield identity at all. Must never reach a page. */
export const REFUSED = 'someone@gmail.com';

/**
 * Sign in through the end-to-end provider.
 *
 * It posts to Auth.js's own callback rather than filling a form, because there is no form for this
 * provider and there should not be: test-only UI on the sign-in page is a surface that can ship by
 * accident. The provider exists only when `E2E_TEST_LOGIN=1` AND the secret is set, so it does not
 * exist on a real deployment at all (HC-003).
 */
export async function signInAs(page: Page, email: string): Promise<void> {
  await page.goto('/login');
  const csrf = await (await page.request.get('/api/auth/csrf')).json();
  const response = await page.request.post('/api/auth/callback/e2e', {
    form: {
      email,
      secret: 'e2e-playwright-shared-secret',
      csrfToken: csrf.csrfToken,
      callbackUrl: '/',
    },
  });
  expect(response.ok(), `signing in as ${email} failed: ${response.status()}`).toBeTruthy();
}

export async function signOut(page: Page): Promise<void> {
  await page.context().clearCookies();
}

/**
 * Screenshot a screen, and return its height IN CSS PIXELS.
 *
 * NUMBERED, because the gallery is read in order and an alphabetical list of fourteen pictures is
 * not a walkthrough of a product. `fullPage` so the reading is the whole screen rather than the
 * part that happened to fit.
 *
 * ## Why the height is recorded here rather than measured off the image
 *
 * The gallery first read the height out of each PNG's header, and reported every phone screen at
 * roughly 2.75 times its real size. The Pixel 5 profile has a device scale factor of 2.75, so a
 * 727px page is a 1,999px image — both numbers are correct and only one of them is the height.
 *
 * A gallery whose whole job is to show a number that means "this screen is too tall" cannot show a
 * number inflated by the hardware it was rendered on. So the measured CSS height is appended to a
 * manifest here, where it is already known, and the gallery reads that. It is also the exact number
 * the ceiling compares against, which is the point: the picture and the assertion agree.
 */
export async function shoot(page: Page, index: number, name: string): Promise<number> {
  mkdirSync(SHOTS, { recursive: true });
  const n = String(index).padStart(2, '0');
  const file = `${n}-${name}.png`;
  await page.screenshot({ path: join(SHOTS, file), fullPage: true });
  const measured = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    width: document.documentElement.clientWidth,
  }));
  appendFileSync(join(SHOTS, 'readings.jsonl'), `${JSON.stringify({ file, name, ...measured })}\n`);
  return measured.height;
}

/**
 * The height ceiling, and the message it fails with.
 *
 * A ceiling is not a style preference. It is the cheap proxy for "this screen shows more than it
 * was meant to", which is the fault that shipped thirty times in the Foundry Studio with every
 * other gate green. The message names the screen and BOTH numbers, because a failure reading
 * "expected 1188 to be less than 1100" tells whoever sees it nothing about which screen or why.
 */
export function withinCeiling(name: string, height: number, ceiling: number): void {
  expect(
    height,
    `${name} is ${height}px tall and its ceiling is ${ceiling}px. Either the screen grew and needs ` +
      'looking at as a picture, or it genuinely needs more room and the ceiling should move in this ' +
      'pull request, with the new reading recorded in docs/design-conformance.md.',
  ).toBeLessThanOrEqual(ceiling);
}

/**
 * A page must never drag sideways.
 *
 * FB-136 found a 393px phone scrolling 92px sideways because an `.sr-only` element escaped its
 * scroll container. Nothing about that is visible in markup, in a unit test, or in a screenshot
 * taken at full page width - only in the numbers.
 */
export async function doesNotDragSideways(page: Page, name: string): Promise<void> {
  const m = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    m.scrollWidth,
    `${name} drags sideways by ${m.scrollWidth - m.clientWidth}px at ${m.clientWidth}px wide. ` +
      'Something is wider than the viewport or positioned outside it.',
  ).toBeLessThanOrEqual(m.clientWidth);
}
