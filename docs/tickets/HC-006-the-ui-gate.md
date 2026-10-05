# HC-006 — The UI gate: Playwright, the screenshot gallery, the design-conformance scorecard

**Status:** Done · **Phase:** 0 · **Depends on:** HC-003 · **Repo:** holy-corner ·
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

- [x] A PR that makes `/` taller than its ceiling fails the "Playwright UI gate" job with a message
      naming the screen and both heights. **Proved by doing it**: twelve paragraphs of the FB-124
      shape ("finished work nobody needed to see") were appended to the group ledger, and the gate
      failed with `/ as admin is 5215px tall and its ceiling is 1100px`, followed by the sentence
      telling the reader which of the two decisions they now have to make. Reverted.
- [x] The gallery artefact downloads from a CI run and contains every numbered screenshot.
      Downloaded from run 36771772528: all fourteen PNGs, `index.html`, `readings.jsonl` and the
      Playwright report.
- [x] `docs/design-conformance.md` has a row per screen with the date, both heights and who looked.
      Fourteen screenshots, nine screens, both sizes.
- [x] The job is in the branch-protection required list. It was already there — HC-001 named all
      ten jobs and HC-054 required them before any of them did anything, which is exactly why the
      name could not be allowed to change. It is now required AND real.

## What the gate found on its first run

The point of the ticket, so it is recorded here rather than only in the pull request.

**Two of the five status tones are the same colour.** `ok` and `working` both resolve to `#1a3b26`.
The group ledger prints a key saying "a reader learns a colour here and it means the same thing on
every screen", above two identical green squares with different labels. Filed as **HC-058** rather
than fixed here: the palette is fountainbridge's, carried over verbatim on purpose, and changing a
brand colour is a decision, not a line in this PR.

**Half the roles were offered a link to the page they were already reading.** Staff land on
`/record` and finance on `/money`; both are unbuilt sections, so both were handed "Back to the
record" / "Back to money" pointing at the screen in front of them. **Fixed here**, with a test that
fails without the fix. Worth noting how it got there: the link used to read "Back to the group" for
everybody, which sent staff somewhere they cannot go; that fault was *also* found by a screenshot
earlier in this ticket, and the repair for it is what created the self-link. Two screenshots, two
faults, same afternoon.

Neither was visible to lint, typecheck, the 135 unit tests, `design-lint` or the build. All of them
passed throughout, and each was right about the question it asked. None of them look.

**Comparing the CI artefact against a local run found two more.** The manifest of readings was
appended to and never cleared, so the deliberately-tall run used to prove the ceiling left a
5,215px reading behind in it; a `globalSetup` now empties it at the start of every run. And the
phone group ledger measures 980px in CI against 954px locally — same commit, different fonts
installed, so text wraps one line differently. The CI number is the one recorded, and the reason
ceilings need real headroom is written down in `docs/design-conformance.md`.

**One more, found sideways and unrelated to screens:** `npm run db:migrate` runs under `bun`, which
is not in this stack and is not on the Railway image, and `railway.json` calls it at boot. The
deploy would not start. Filed as **HC-059**, blocking HC-007.

## Verification

`/qa`. The gallery from this PR's own CI run, opened and looked at, linked in the PR.
