import { expect, test } from '@playwright/test';
import {
  CAST,
  NO_ROLE,
  REFUSED,
  doesNotDragSideways,
  shoot,
  signInAs,
  signOut,
  withinCeiling,
} from './helpers';

/**
 * Every screen, at desktop size, looked at and measured (HC-006).
 *
 * The heights below are ceilings, not targets. Each one is the reading taken when the screen was
 * last looked at as a picture, plus room to breathe. A screen that grows past its ceiling is not
 * necessarily wrong - but it is definitely something a person should look at before it merges,
 * which is the whole point.
 *
 * `docs/design-conformance.md` carries the readings and who took them.
 */

const CEILING = {
  login: 1_100,
  notAuthorized: 1_100,
  refused: 1_100,
  group: 1_100,
  record: 1_100,
  money: 1_100,
  needsYou: 1_100,
  whatHappened: 1_100,
} as const;

test.describe('the screens a signed-out visitor can reach', () => {
  test('the sign-in door', async ({ page }) => {
    await signOut(page);
    await page.goto('/login');
    const signin = page.getByTestId('signin');
    await expect(signin).toBeVisible();
    // The house lockup, which HC-002 had to fix: the name, a rule, then the product.
    await expect(signin.locator('.wordmark-name')).toHaveText('Bruntsfield');
    await expect(signin.locator('.wordmark-sub')).toHaveText('OS');
    // THE TOP BAR IS HIDDEN HERE, and asserted rather than assumed. It carries a wordmark of its
    // own, so leaving it up would print the name twice on the one screen whose job is to introduce
    // the product - which is the repetition HC-002 had to take out of the bar in the first place.
    // The selector above found two `.wordmark-name` elements, which is what prompted checking.
    await expect(page.locator('.topbar')).toBeHidden();
    // Both doors, because HC_PASSWORD_LOGINS is configured for the gate.
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
    await expect(page.getByTestId('password-login')).toBeVisible();

    const height = await shoot(page, 1, 'login');
    withinCeiling('/login', height, CEILING.login);
    await doesNotDragSideways(page, '/login');
  });

  test('nothing else is reachable at all', async ({ page }) => {
    // Not a nicety. This is the admin hub for the whole group; there is no page here that is safe
    // to serve to nobody (HC-003's middleware).
    await signOut(page);
    for (const path of ['/', '/record', '/money', '/needs-you', '/what-happened']) {
      await page.goto(path);
      await expect(page, `${path} must send a signed-out visitor to the door`).toHaveURL(/\/login/);
    }
  });

  test('a look-alike path is still gated', async ({ page }) => {
    // `/login-as-admin` must not be public just because it starts with the same letters. The
    // middleware matcher is anchored to whole segments for exactly this.
    await signOut(page);
    await page.goto('/login-as-admin');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('signed in, with no role', () => {
  test('lands on not-authorized and is told what to do', async ({ page }) => {
    await signInAs(page, NO_ROLE);
    await page.goto('/');
    await expect(page).toHaveURL(/\/not-authorized/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('You do not have a role yet');
    // The page names the account, so somebody who used the wrong one can see that they did.
    await expect(page.getByText(NO_ROLE)).toBeVisible();
    // And offers a way out, because otherwise they are stuck.
    await expect(page.getByTestId('account-menu')).toBeVisible();

    const height = await shoot(page, 2, 'not-authorized');
    withinCeiling('/not-authorized', height, CEILING.notAuthorized);
    await doesNotDragSideways(page, '/not-authorized');
  });

  test('sees no sections, because there is nothing it may open', async ({ page }) => {
    await signInAs(page, NO_ROLE);
    await page.goto('/');
    await expect(page.locator('.topnav-wide .pill')).toHaveCount(0);
  });
});

test.describe('an account that is not a Bruntsfield identity', () => {
  test('never reaches a page, and is told it is the account and not a permission', async ({ page }) => {
    // HC-003's rule: an allowlist is a convenience and a domain is a boundary. The two people who
    // land on this page need different sentences, and they get them.
    await signInAs(page, REFUSED);
    await page.goto('/');
    await expect(page).toHaveURL(/\/not-authorized/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'That is not a Bruntsfield account',
    );
    await expect(page.getByText('No administrator can change this for you')).toBeVisible();

    const height = await shoot(page, 3, 'refused-wrong-domain');
    withinCeiling('/not-authorized (wrong domain)', height, CEILING.refused);
  });
});

test.describe('the four roles', () => {
  /**
   * What each role is offered, and what the SERVER does when they type a URL they were not offered.
   *
   * This closes HC-003's one unticked criterion. It could not be written there: HC-003 asks for a
   * Playwright test per role, and Playwright arrives here, in a ticket that depends on HC-003. The
   * cases were driven through a browser by hand at the time and recorded in that ticket; this is
   * the committed version.
   */
  const EXPECTED: Record<string, { lands: RegExp; sections: string[]; refused: string[] }> = {
    admin: {
      lands: /\/$/,
      sections: ['The group', 'The record', 'Money', 'Needs you', 'What happened'],
      refused: [],
    },
    exec: {
      lands: /\/$/,
      sections: ['The group', 'The record', 'Money', 'Needs you', 'What happened'],
      refused: [],
    },
    finance: {
      lands: /\/money$/,
      sections: ['The record', 'Money', 'Needs you', 'What happened'],
      refused: [],
    },
    staff: {
      lands: /\/record$/,
      sections: ['The record', 'Needs you'],
      refused: ['/money', '/what-happened'],
    },
  };

  for (const [role, expected] of Object.entries(EXPECTED)) {
    test(`${role}: lands where it belongs and is offered only its own sections`, async ({ page }) => {
      await signInAs(page, CAST[role as keyof typeof CAST]);
      await page.goto('/');
      await expect(page, `${role} landed somewhere it cannot work`).toHaveURL(expected.lands);
      await expect(page.locator('.topnav-wide .pill')).toHaveText(expected.sections);
      // The bar says which role you are, so somebody looking at the wrong data knows why.
      await expect(page.getByTestId('account-menu')).toContainText(role);
    });

    test(`${role}: the server refuses what the navigation does not offer`, async ({ page }) => {
      // A navigation that hides a link is NOT a permission system. HC-003 shipped the nav first and
      // the gate second, and in between `staff` could read Money by typing the URL.
      await signInAs(page, CAST[role as keyof typeof CAST]);
      for (const path of expected.refused) {
        const response = await page.request.get(path);
        expect(
          response.status(),
          `${role} typed ${path} and the server served it. 404, never 403: a 403 confirms the ` +
            'section exists and is worth hiding.',
        ).toBe(404);
      }
    });
  }

  test('the way back never points at the page you are reading', async ({ page }) => {
    // Found by looking at 05-record-staff.png, not by a test. Staff land on /record and finance on
    // /money; both sections are unbuilt, so both were offered "Back to the record" / "Back to
    // money" linking to the page already on screen. Half the roles had a dead control.
    //
    // Every earlier check passed: the link existed, had an href, and that href resolved. Only the
    // picture put the heading and the link in the same field of view.
    for (const [role, landing] of [
      ['staff', '/record'],
      ['finance', '/money'],
    ] as const) {
      await signOut(page);
      await signInAs(page, CAST[role]);
      await page.goto(landing);
      await expect(
        page.getByRole('link', { name: /^Back to/ }),
        `${role} is on ${landing}, their own landing page, and is offered a way back to it`,
      ).toHaveCount(0);
    }

    // And where there IS somewhere to go, the link is still there and still goes somewhere else.
    await signOut(page);
    await signInAs(page, CAST.staff);
    await page.goto('/needs-you');
    const back = page.getByRole('link', { name: /^Back to/ });
    await expect(back).toHaveText('Back to the record');
    await back.click();
    await expect(page).toHaveURL(/\/record$/);
  });

  test('the group ledger, as an admin', async ({ page }) => {
    await signInAs(page, CAST.admin);
    await page.goto('/');
    await expect(page.getByTestId('tone-key')).toBeVisible();
    const height = await shoot(page, 4, 'group-admin');
    withinCeiling('/ as admin', height, CEILING.group);
    await doesNotDragSideways(page, '/ as admin');
  });

  test('the record, as staff', async ({ page }) => {
    await signInAs(page, CAST.staff);
    await page.goto('/record');
    const height = await shoot(page, 5, 'record-staff');
    withinCeiling('/record as staff', height, CEILING.record);
  });

  test('money, as finance', async ({ page }) => {
    await signInAs(page, CAST.finance);
    await page.goto('/money');
    const height = await shoot(page, 6, 'money-finance');
    withinCeiling('/money as finance', height, CEILING.money);
  });

  test('needs you, and what happened', async ({ page }) => {
    await signInAs(page, CAST.admin);
    await page.goto('/needs-you');
    withinCeiling('/needs-you', await shoot(page, 7, 'needs-you'), CEILING.needsYou);
    await page.goto('/what-happened');
    withinCeiling('/what-happened', await shoot(page, 8, 'what-happened'), CEILING.whatHappened);
  });
});

test.describe('the second door', () => {
  test('signs in with email and password, and is scoped the same way', async ({ page }) => {
    // HC-003's rule: authorization never depends on which door somebody came through. This account
    // has no role, so it lands exactly where the Google-signed-in no-role account does.
    await signOut(page);
    await page.goto('/login');
    await page.fill('input[name="email"]', 'walkthrough@bruntsfield.capital');
    await page.fill('input[name="password"]', 'e2e-walkthrough-password-not-for-production');
    await page.getByTestId('password-login').getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/not-authorized/);
  });

  test('gives the same message for a wrong password and an unknown address', async ({ page }) => {
    // Which check failed is exactly what somebody guessing wants to learn.
    const messages: string[] = [];
    for (const [email, password] of [
      ['walkthrough@bruntsfield.capital', 'the-wrong-password'],
      ['nobody@bruntsfield.capital', 'anything-at-all'],
    ]) {
      await signOut(page);
      await page.goto('/login');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.getByTestId('password-login').getByRole('button', { name: 'Sign in' }).click();
      await expect(page.getByTestId('signin-error')).toBeVisible();
      messages.push((await page.getByTestId('signin-error').textContent()) ?? '');
    }
    expect(messages[0]).toBe(messages[1]);
  });
});
