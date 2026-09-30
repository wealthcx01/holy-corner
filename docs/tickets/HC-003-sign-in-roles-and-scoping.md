# HC-003 — Sign-in: Google and the password door, roles, the admin allowlist, server-side scoping

**Status:** Done · **Phase:** 0 · **Depends on:** HC-002 · **Repo:** holy-corner ·
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

- [x] Both of John's addresses land on `/` as `admin`; a `@bruntsfield.capital` account with no
      role lands on `/not-authorized`; a `@gmail.com` account never reaches a page. All seven cases
      driven through a real browser against a production build.
- [x] With `HC_PASSWORD_LOGINS` unset the login page has no password form and the provider does not
      exist; with one minted entry the account signs in and is scoped by `lib/authz.ts` identically
      to Google.
- [x] Unknown email and wrong password give a byte-identical message, checked by comparing the two
      rendered strings rather than by reading the code. The throttle is covered by the ported tests.
- [ ] **A Playwright test per role.** *Not done, and it cannot be done in this ticket.* Playwright
      arrives in HC-006, which depends on HC-003, so this criterion asks for a tool the dependency
      order does not have yet. The cases it describes were all driven through a real browser and
      are recorded below; HC-006 turns them into the committed spec. See "An ordering problem in
      the ticket set" below.
- [x] `/login`, `/not-authorized` and the four role variants screenshotted at 1440×1000 and
      393×851, heights recorded below, and looked at.

## Verification

`/review` with the security specialist on, then `/qa`. `npx vitest run lib/__tests__/authz.test.ts`
and the e2e `sign-in.spec.ts` in the PR.


## What running it turned up

**The authorization decision was computed and then not acted on.** The first build resolved the
principal, rendered the correct navigation for every role, and stopped there. Every role got exactly
the right set of links, which is what made it convincing. Driving it through a browser showed what
the links were hiding:

- a `@bruntsfield.capital` account with NO ROLE reached `/` and read the page.
- a `@gmail.com` account, which `resolvePrincipal` refuses outright, got a session, reached `/`, and
  read the page.
- `finance`, not offered "The group", could open it by typing the URL.
- `staff`, not offered Money, could open that by typing the URL.

`lib/nav.ts` says in its own comment that a navigation which hides a link is not a permission system
and must never be mistaken for one. The first build was exactly that. Four checks now exist where
there were none: a route group that every page behind the sign-in inherits by existing, and a
`requireSection` call per page that asks `navFor` rather than carrying its own copy of the rules, so
the link a role is offered and the page a role may open are THE SAME DECISION. Refusals are 404,
never 403.

**A test now makes forgetting the gate a build failure.** `lib/__tests__/section-gate.test.ts` reads
the pages off disk and checks three directions: every page gates itself, every gated route is one
some role is offered, and every route some role is offered has a page behind it. That last one is
FB-124's dead nav row, which HC-002 had to fix once already.

**Signing in as finance or staff produced a 404.** Found by screenshotting the four roles: the
heights came back 1,188px instead of 1,000px, because the picture was of an error page. The root
holds the group ledger, which only `admin` and `exec` may read, and it is also where every sign-in
lands. It now routes by role. HC-030 settles the destinations in words and this follows them:
finance lands on Money, staff on the record.

**"Back to the group" was offered to people with no group.** The placeholder pages all linked to
`/`. For a staff account that link bounced them to their own landing page while claiming to do
something else. It now points at the role's own landing section, lower-cased because it sits
mid-sentence.

**The password door's tests were ported with it.** HC-001 ported `lib/ticket-drift.ts` and left its
tests behind, so a required check shipped with no coverage. Fountainbridge has 171 lines of tests
for `lib/password-login.ts` and they came across too. Every rule in that file is a security
property, and a security property with no test is a comment.

## An ordering problem in the ticket set

HC-003's fourth criterion asks for "a Playwright test per role". **Playwright arrives in HC-006,
which depends on HC-003.** The dependency order cannot satisfy this ticket's own criterion.

Installing Playwright here to close it would take HC-006's scope into HC-003 and leave HC-006
holding a ticket whose main deliverable already exists. So the cases were driven through a browser
using the copy of Playwright the Foundry Studio already has on this machine, the evidence is below,
and HC-006 commits the spec. The criterion is left unticked rather than reworded, because the
honest state of it is "blocked on a later ticket", not "done".

## The readings

| Screen | Desktop 1440×1000 | Phone 393×851 |
|---|---|---|
| `/login` | 1,000px | 851px |
| `/not-authorized` | 1,000px | 851px |
| `/` as admin | 1,000px | 954px |
| `/` as exec | 1,000px | 954px |
| `/money` as finance (where finance lands) | 1,000px | 851px |
| `/record` as staff (where staff lands) | 1,000px | 851px |

No screen drags sideways and none logs a console error. The sign-in page was compared against
fountainbridge's: same paper, same Bottle Green primary button, same lockup over a hairline rule,
same underlined fields rather than boxes.

Behaviour, all through a real browser against a production build:

| Who | Lands on | Sections offered | `/` | `/record` | `/money` | `/needs-you` | `/what-happened` |
|---|---|---|---|---|---|---|---|
| admin (either address) | `/` | 5 | 200 | 200 | 200 | 200 | 200 |
| exec | `/` | 5 | 200 | 200 | 200 | 200 | 200 |
| finance | `/money` | 4 | redirects | 200 | 200 | 200 | 200 |
| staff | `/record` | 2 | redirects | 200 | **404** | 200 | **404** |
| no role | `/not-authorized` | 0 | — | — | — | — | — |
| `@gmail.com` | `/not-authorized` | 0 | — | — | — | — | — |
