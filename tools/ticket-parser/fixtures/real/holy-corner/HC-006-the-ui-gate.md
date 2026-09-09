# HC-006 — The UI gate: Playwright, the screenshot gallery, the design-conformance scorecard

**Status:** Todo · **Phase:** 0 · **Depends on:** HC-003 · **Repo:** holy-corner ·
**Branch:** `hc-006-the-ui-gate` · One ticket = one branch = one PR.

## Why this matters (for John)

Fountainbridge shipped thirty tickets with every automated check green while its main screen was
9,908 pixels tall against a design of 1,900. The only gate that sees a screen is a browser, and the
only reader that notices "this is unusable" is a person looking at the picture. This ticket makes
the browser run on every PR, makes the pictures an artefact, and makes "looked at" a line in a file.

## Context

- fountainbridge `playwright.config.ts`: port 3100, `workers: 1`, `chromium` and `mobile` (Pixel 5,
  Chromium-based so CI needs no WebKit) projects, `webServer` = `npm run build && npm run start`
  with a full fixture environment and `E2E_NOW` pinned so staleness is deterministic. Specs write
  numbered PNGs to `e2e/__screenshots__/` (gitignored), uploaded as the `ui-gate-gallery` artefact
  `if: always()`.
- `docs/design-conformance.md` in fountainbridge is the scorecard: the method, each screen's last
  reading, height at both sizes. CLAUDE.md #11 says add a line per screen change.
- The Playwright job is a **required** check from the first PR here. Fountainbridge amended that in
  on 2026-08-28 after an advisory one merged itself red.
- There is no Claude Design artefact for Holy Corner yet. Until one exists, the "design" side is the
  matching grassmarket or fountainbridge screen; when HC-030's design lands, it replaces that.

## Scope

- Playwright installed; `e2e/helpers.ts` with `signInAs(role)` through the E2E provider;
  `e2e/shell.spec.ts` screenshotting `/login`, `/`, `/not-authorized` for each role at 1440×1000 and
  393×851 and asserting page height under a stated ceiling per screen.
- `npm run test:e2e`, the "Playwright UI gate" CI job made real (build, run, upload gallery),
  `E2E_NOW` fixed, fixture env in the config.
- `docs/design-conformance.md` created with the method and a first reading for every screen that
  exists.
- `scripts/ui-gallery.mjs` (from grassmarket) to render the gallery locally as one HTML page.

## Out of scope

- Any new screen. Pixel-diff snapshots: heights and eyes, because pixel diffs rot.

## Acceptance criteria

- [ ] A PR that makes `/` taller than its ceiling fails the "Playwright UI gate" job with a message
      naming the screen and both heights.
- [ ] The gallery artefact downloads from a CI run and contains every numbered screenshot.
- [ ] `docs/design-conformance.md` has a row per screen with the date, both heights and who looked.
- [ ] The job is in the branch-protection required list (screenshot in the PR).

## Verification

`/qa`. The gallery from this PR's own CI run, opened and looked at, linked in the PR.
