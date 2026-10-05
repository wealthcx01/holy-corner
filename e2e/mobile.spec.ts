import { expect, test } from '@playwright/test';
import { CAST, NO_ROLE, doesNotDragSideways, shoot, signInAs, signOut, withinCeiling } from './helpers';

/**
 * The same screens at 393x851, which is where the faults actually are (HC-006).
 *
 * Fountainbridge's FB-124 put a 250px rail on a 393px phone with every other gate green, and FB-136
 * found a phone dragging sideways by 92px because an `.sr-only` element escaped its scroll
 * container. Neither is visible in markup or in a unit test. Both are obvious in a picture and in
 * two numbers.
 *
 * Ceilings are higher here than on desktop, and that is expected: the same content in a third of
 * the width is taller. What matters is that a screen does not grow past what a thumb can reasonably
 * scroll, and that nothing drags sideways at all.
 */

const CEILING = {
  login: 1_000,
  notAuthorized: 1_000,
  group: 1_200,
  record: 1_000,
  money: 1_000,
} as const;

test.describe('on a phone', () => {
  test('the sign-in door fits and does not drag sideways', async ({ page }) => {
    await signOut(page);
    await page.goto('/login');
    await expect(page.getByTestId('signin')).toBeVisible();
    const height = await shoot(page, 20, 'phone-login');
    withinCeiling('/login on a phone', height, CEILING.login);
    await doesNotDragSideways(page, '/login on a phone');
  });

  test('the sections become a drawer rather than overflowing the bar', async ({ page }) => {
    // Five pills in a flex row is fine at 1440 and does not fit 393. HC-002 built the drawer in the
    // first commit that had a navigation rather than waiting for somebody to notice.
    await signInAs(page, CAST.admin);
    await page.goto('/');

    await expect(page.locator('.topnav-wide')).toBeHidden();
    await expect(page.getByTestId('topnav-toggle')).toBeVisible();
    // Closed, nothing is hiding off-screen adding to the page's scroll width.
    await expect(page.getByTestId('topnav-drawer')).toHaveCount(0);
    await doesNotDragSideways(page, '/ on a phone, drawer closed');

    await page.getByTestId('topnav-toggle').click();
    await expect(page.getByTestId('topnav-drawer')).toBeVisible();
    await expect(page.locator('.topnav-drawer-link')).toHaveCount(5);
    await doesNotDragSideways(page, '/ on a phone, drawer open');

    await shoot(page, 21, 'phone-drawer-open');
  });

  test('every drawer link goes where it says', async ({ page }) => {
    // A drawer whose links close the drawer without navigating is a dead control wearing a label.
    await signInAs(page, CAST.admin);
    for (const [label, path] of [
      ['The record', '/record'],
      ['Money', '/money'],
      ['Needs you', '/needs-you'],
      ['What happened', '/what-happened'],
    ]) {
      await page.goto('/');
      await page.getByTestId('topnav-toggle').click();
      await page.getByRole('link', { name: new RegExp(`^${label}`) }).click();
      await expect(page, `"${label}" did not go to ${path}`).toHaveURL(new RegExp(`${path}$`));
    }
  });

  test('the group ledger', async ({ page }) => {
    await signInAs(page, CAST.admin);
    await page.goto('/');
    const height = await shoot(page, 22, 'phone-group-admin');
    withinCeiling('/ as admin on a phone', height, CEILING.group);
    await doesNotDragSideways(page, '/ as admin on a phone');
  });

  test('where finance and staff land', async ({ page }) => {
    await signInAs(page, CAST.finance);
    await page.goto('/');
    await expect(page).toHaveURL(/\/money$/);
    withinCeiling('/money on a phone', await shoot(page, 23, 'phone-money-finance'), CEILING.money);
    await doesNotDragSideways(page, '/money on a phone');

    await signOut(page);
    await signInAs(page, CAST.staff);
    await page.goto('/');
    await expect(page).toHaveURL(/\/record$/);
    withinCeiling('/record on a phone', await shoot(page, 24, 'phone-record-staff'), CEILING.record);
  });

  test('not-authorized still offers a way out', async ({ page }) => {
    // The account menu is the only control on that page, and on a phone the bar drops the role
    // label to make room. Losing the way out entirely would strand somebody who used the wrong
    // account, which is the most likely reason to be here.
    await signInAs(page, NO_ROLE);
    await page.goto('/');
    await expect(page).toHaveURL(/\/not-authorized/);
    await expect(page.getByTestId('account-menu')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign out/ })).toBeVisible();
    // The role label is the part a phone can spare, and it is the part that goes.
    await expect(page.locator('.topbar-account-role')).toBeHidden();
    const height = await shoot(page, 25, 'phone-not-authorized');
    withinCeiling('/not-authorized on a phone', height, CEILING.notAuthorized);
    await doesNotDragSideways(page, '/not-authorized on a phone');
  });
});
