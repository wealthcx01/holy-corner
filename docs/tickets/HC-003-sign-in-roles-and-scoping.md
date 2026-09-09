# HC-003 — Sign-in: Google and the password door, roles, the admin allowlist, server-side scoping

**Status:** Todo · **Phase:** 0 · **Depends on:** HC-002 · **Repo:** holy-corner ·
**Branch:** `hc-003-sign-in-roles-and-scoping` · One ticket = one branch = one PR.

## Why this matters (for John)

This is the admin hub of the whole group. Who can see it, and what each person can see, has to be
decided on the server before a single row is read, and it has to be tested from the first day. The
pattern exists in fountainbridge and it is good; this ticket copies it and adds the roles the plan
needs (`admin`, `exec`, `finance`, `staff`).

## Context

- fountainbridge splits auth three ways for the edge runtime: `auth.config.ts` (edge-safe, no
  providers, `authorized` / `jwt` / `session` callbacks), `auth.ts` (Node: Google, a `password`
  Credentials provider that only exists when `STUDIO_PASSWORD_LOGINS` parses, an `e2e` provider
  that only exists with a secret), `middleware.ts` (signed-in only; matcher excludes `api/auth`,
  `api/health$`, `login`, `not-authorized`). `lib/authz.ts` is a pure function called on every page.
- FB-092's password door: scrypt hashes in an env var, minted by a script that reads stdin, no user
  enumeration (a decoy hash), five failures pause an email for fifteen minutes, malformed entries
  skipped and warned by position. Port `lib/password-login.ts` and `scripts/mint-password-login.mjs`
  as they are.
- John has two identities: `john@bruntsfield.capital` and `john.gallagher@wealthcx.com`.
  fountainbridge's production admin list carries both. So must ours.
- grassmarket's rule for auto-provisioning (ADR-0044): a verified Workspace `hd` claim can create an
  account, but the role is always the lowest, never configurable. Same here: a new
  `@bruntsfield.capital` sign-in becomes `staff` with no data access until an admin assigns a role.
- The "Holy Corner claim shape" (`sub, email, role, tier, assessor_level, iss, aud, iat, exp`) is
  grassmarket's SSO contract. This ticket does **not** issue it (HC-035 does); it only makes sure
  our session carries `sub` and `role` in a way that can.

## Scope

- Auth.js with Google (primary), the password door, the E2E provider. `.env.example` names
  `AUTH_SECRET`, `AUTH_TRUST_HOST`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `HC_ADMIN_EMAILS`,
  `HC_PASSWORD_LOGINS`, `HC_WORKSPACE_DOMAIN` (`bruntsfield.capital`), `E2E_TEST_LOGIN`,
  `E2E_TEST_LOGIN_SECRET`.
- `lib/authz.ts`: `resolvePrincipal(email, adminEmails, roleAssignments)` → `{ sub, email, role,
  pillars }`. Admin from the allowlist; every other role from the database (HC-004 creates the
  table; until then an in-memory map behind the same interface). Unit-tested for admin, each role,
  unknown email, empty email, and a `@gmail.com` refused.
- `/login` in the house style with the Google button and, when configured, the password form;
  one generic failure message. `/not-authorized` for a signed-in account with no role.
- Nav (HC-002) becomes a function of role: `finance` does not see "The group"; `staff` sees only
  what its pillar allows; `exec` sees everything read-only; `admin` sees everything plus act-as
  links (HC-031 and HC-032 add them).
- Scoping tests: a request for a resource outside the principal's scope returns 404, never 403,
  never a body that confirms existence (grassmarket's `ScopeViolationError → 404`).

## Out of scope

- Issuing tokens to grassmarket (HC-035). Refresh tokens. Password reset, 2FA, self-signup.
- Setting the production variables: a human step on Railway (HC-007).

## Acceptance criteria

- [ ] John's Google account (either address) lands on `/` as `admin`; a `@bruntsfield.capital`
      account with no role lands on `/not-authorized`; a `@gmail.com` account is refused.
- [ ] With `HC_PASSWORD_LOGINS` unset the login page has no password form; with one minted entry
      the walkthrough account signs in and is scoped identically to Google.
- [ ] Unknown email and wrong password give the same message; five failures pause the email.
- [ ] A Playwright test per role asserts what the nav shows and that an out-of-scope URL is 404.
- [ ] `/login`, `/not-authorized` and the four role variants of `/` screenshotted at both sizes.

## Verification

`/review` with the security specialist on, then `/qa`. `npx vitest run lib/__tests__/authz.test.ts`
and the e2e `sign-in.spec.ts` in the PR.
