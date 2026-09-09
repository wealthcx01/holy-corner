# HC-052 — The public site's login router and the Holy Corner front door

**Status:** Todo · **Phase:** 4 · **Depends on:** HC-035 · **Repo:** holy-corner, plus the public
site repo · **Branch:** `hc-052-the-public-sites-login-door` · One ticket = one branch = one PR per repo.

## Why this matters (for John)

Grassmarket's portal table says the main site routes login by role. Fountainbridge's plan says
Holy Corner is the main website plus landing page. Today the public site has no LOG IN that lands
anyone anywhere. After HC-035 there is one sign-in; this ticket gives it a door on the site people
already visit, and a plain "not authorised" page for anyone else.

## Context

- The public site lives in `C:\dev\bruntsfield capital website` (repo `wealthcx01/wealthcxwebsite`
  or its successor; confirm at ticket time). Its `colors_and_type.css` is the origin of every studio's
  tokens.
- HC-035's `os.bruntsfieldcapital.com/login?next=` and role routing.
- grassmarket GRS-0074's rule: the site's LOG IN is a plain link; the whole round trip is driven
  by the issuer; no token in a URL.

## Scope

- Public site: a LOG IN control in the header linking to the issuer; nothing else changes there.
- Holy Corner: `/login` accepts `next` (validated against the three studio origins only), routes by
  role after sign-in, and renders a plain "you are signed in but have no studio yet" page for an
  account with no role anywhere.
- `/` for a signed-out visitor: the house-style front page for Bruntsfield OS (one sentence, the
  sign-in), no data.

## Out of scope

- Marketing content. The Foundry landing page (HC-053).

## Acceptance criteria

- [ ] From the public site, a consultant, a founder and John each land in the right studio in one
      sign-in; a `next` pointing anywhere else is ignored.
- [ ] A `@bruntsfield.capital` account with no role sees the plain page, not an error.
- [ ] Screens at both sizes, beside the public site's own header for consistency.

## Verification

`/qa` end to end on production domains.
