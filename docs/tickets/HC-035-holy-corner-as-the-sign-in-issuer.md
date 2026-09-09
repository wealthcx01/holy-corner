# HC-035 — Holy Corner as the sign-in issuer: the claim shape, the shared cookie, the public site's door

**Status:** Todo · **Phase:** 2 · **Depends on:** HC-003, HC-031 · **Repo:** holy-corner, plus
grassmarket and fountainbridge companions · **Branch:** `hc-035-holy-corner-as-the-sign-in-issuer` ·
One ticket = one branch = one PR per repo.

## Why this matters (for John)

Grassmarket already issues a token in "the Holy Corner claim shape" and says that at phase two only
the issuer moves: Holy Corner signs, grassmarket verifies, no feature code changes. Fountainbridge
calls Google-per-vertical "the Holy Corner vertical-login pattern". This ticket makes the name
true: one sign-in for the group, on one cookie, with the public site's LOG IN sending each person
to the right studio by role.

## Context

- `JWTClaims` (`sub, email, role, tier, assessor_level, iss, aud, iat, exp`, `extra="forbid"`),
  HS256, 30-minute access, rotated single-use refresh tokens (GRS-0120), the one-time-code handoff
  (GRS-0074: never a token in a URL), and the stated end state: a cookie on `.bruntsfieldcapital.com`
  once the custom domain lands. Grassmarket's verification is `decode_access_token` checking
  `iss` and `aud`; only the issuer and key move.
- fountainbridge: Auth.js Google + password + e2e providers, `STUDIO_ADMIN_EMAILS`, manifests'
  `workspace_email` as the scoping key. It would verify a Holy Corner cookie as an additional
  provider, keeping Google as the fallback door.
- The three domains: `os.`, `advisors.`, `clients.bruntsfieldcapital.com`, and the public site
  (`bruntsfield capital website` repo locally) whose LOG IN routes by role.
- Keys: asymmetric (RS256 or EdDSA) so the studios verify with a public key and no studio holds the
  signing key; a JWKS endpoint on Holy Corner.

## Scope

- Holy Corner issues: after HC-003's sign-in, mint the claim-shape token for the person's grassmarket
  role/tier/assessor level (read via HC-031) and set it as an httpOnly cookie on
  `.bruntsfieldcapital.com`; `/.well-known/jwks.json`; refresh per GRS-0120's rules; `iss =
  os.bruntsfieldcapital.com`, `aud = bruntsfield`.
- grassmarket companion: verify tokens whose `iss` is Holy Corner against the JWKS, alongside its
  own for the transition; the one-time-code exchange accepts a Holy Corner session as the source.
- fountainbridge companion: a provider that accepts the shared cookie, scoped by
  `workspace_email` as today.
- Public site: LOG IN → `os.bruntsfieldcapital.com/login?next=…`; after sign-in, route by role:
  consultants to advisors, founders to foundry, admin/exec/finance/staff to Holy Corner, clients to
  Viewforth when it exists, otherwise a plain "no studio yet" page.
- `docs/adr/ADR-0004-one-sign-in-for-the-group.md`.

## Out of scope

- Removing Google from either studio (it stays as the fallback door). Self-signup. Viewforth's own
  session.

## Acceptance criteria

- [ ] A consultant signs in once at the public site and lands in grassmarket authenticated, with
      no token in any URL at any step (asserted).
- [ ] John signs in once and can open all three studios without signing in again; signing out at
      Holy Corner signs out of all three.
- [ ] A token forged with the old grassmarket secret is refused by grassmarket once the transition
      flag is off; a token with the wrong `aud` is refused by all three.
- [ ] The signing key exists only on Holy Corner's Railway service (verified absent from the other
      two).

## Verification

`/review` with security on, on all three PRs; `/qa` end to end on staging domains.
