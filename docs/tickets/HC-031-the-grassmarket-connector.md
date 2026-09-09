# HC-031 — The grassmarket connector: the admin reads the Advisory Studio deferred to Holy Corner

**Status:** Todo · **Phase:** 2 · **Depends on:** HC-003, HC-005 · **Repo:** holy-corner, plus
companion tickets in grassmarket · **Branch:** `hc-031-the-grassmarket-connector` ·
One ticket = one branch = one PR per repo.

## Why this matters (for John)

Grassmarket was built flat by decision: every consultant sees only their own pipeline, engagements,
earnings and assessments. The cross-consultant views — who is stuck where, who is earning what,
who has passed which certification, what is waiting for the founder — were deferred to Holy Corner
by name in GRS-0026, GRS-0028, GRS-0119, GRS-0132 and GRS-0208. This ticket is where they land,
built on the admin role plumbing grassmarket already has.

## Context

- grassmarket's admin surface today: `Role.ADMIN` in the JWT `role` claim; `principal.is_admin`
  bypasses in the repository; admin-gated writes for invitations (`POST /auth/invitations`, no UI),
  commission recording and payment status (no UI), quiz approval, certification admin, course
  authoring (the one admin UI); `GET /founder-review/queue`; `GET /bench/queue`; retired committee
  and calibration routers kept dormant. `ScopeViolationError → 404`. Every admin action audited.
- What does **not** exist there: a leaderboard, an earnings aggregate, a cross-consultant academy
  progress view, an admin list of engagements or prospects across consultants, a webhook of any kind.
- Identity: HC-003's session is not a grassmarket JWT. Until HC-035 makes Holy Corner the issuer,
  the connector authenticates as a grassmarket admin service account with a token minted by
  grassmarket for Holy Corner (`GM_SERVICE_TOKEN`, rotated, in Railway env), and every read carries
  the acting Holy Corner person's email in a header grassmarket audits.
- Act-as (GRS-0208) is grassmarket's; "open the Advisory Studio as <consultant>" is a deep link
  into it with the admin identity, never a Holy Corner re-implementation.
- Local mirror note: `C:\dev\Grassmarket` is at GRS-0245; the VM has GRS-0264. Read the VM copy.

## Scope

**grassmarket companions (each its own GRS ticket, additive, admin-only, audited):**
- `GET /admin/consultants` (tier, assessor level, certification summary, engagement counts,
  average rating, conversion, last active), `GET /admin/pipeline` (every prospect by stage, owner),
  `GET /admin/engagements` (every engagement with stage, deliverable slots, comms recency),
  `GET /admin/earnings/summary` (per consultant: pending, invoiced, paid, blocked on client),
  `GET /admin/academy/progress` (per consultant: lessons, section tests, certifications),
  `GET /admin/queues` (founder review, bench, quiz approvals, invitations outstanding).
- A service-token principal kind with `role = admin`, `sub` = the Holy Corner service, and a
  required `X-Acting-Person` header recorded in `audit_events`.

**Holy Corner:**
- `lib/connectors/grassmarket/client.ts` (base URL, token, acting header, per-call timeout,
  typed by the generated bcap-contracts types), with an in-memory cache of two minutes and
  `?refresh=1` (the fountainbridge GitHub client pattern).
- Screens under **The group → Advisory**: consultants (the leaderboard the founder asked for:
  engagements, ratings, conversion, earnings, certification, one row each, "open as" link),
  pipeline across everyone (stage columns, owner chips), engagements in delivery, earnings across
  everyone (one currency), academy progress, the queues (founder review, bench, quizzes, invitations)
  with deep links to act in grassmarket.
- The organisation and people mirrors (HC-010, HC-011) populated from these reads with links back.
- The Advisory section of the group ledger (HC-030) fed from these reads.

## Out of scope

- Any write into grassmarket except through its existing endpoints as a proposed and approved
  external action (HC-018's client-paid is the first). Re-implementing act-as, the wizard, or any
  consultant screen. Invitations *UI* here (a follow-up once the reads land; the endpoint exists).

## Acceptance criteria

- [ ] The six grassmarket endpoints exist, refuse a non-admin with 404, and log the acting person.
- [ ] The Advisory screens render from grassmarket staging with real seeded data and from fixtures
      in the UI gate.
- [ ] "Open the Advisory Studio as <consultant>" lands in grassmarket's act-as session for that
      consultant, with its banner.
- [ ] A grassmarket outage renders "could not be read" within the timeout and no stale-as-fresh
      data (the cache shows its age).
- [ ] Screens at both sizes.

## Verification

`/review` on both sides, `/qa` against grassmarket staging.
