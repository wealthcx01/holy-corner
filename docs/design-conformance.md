# Design conformance

The scorecard CLAUDE.md #11 asks for. One line per screen, per size, with the height it was last
measured at and the date somebody looked at it as a picture.

**Why a document and not just a test.** The test holds the ceiling. This holds the *reading* — what
the screen was actually measured at, and whether a person looked. A ceiling of 1,100px tells you
nothing about whether the screen is 1,000px or 1,099px, and the difference between those two is
the difference between a screen with room and a screen about to fail on its next line of copy.

## How the readings are taken

`e2e/` renders every screen at both sizes through the **production build** (`next build && next
start`, not `next dev`), takes a full-page screenshot, and records the height. Three things about
that are deliberate:

- **The height is measured in the browser, in CSS pixels** (`document.documentElement.scrollHeight`),
  and written to `e2e/__screenshots__/readings.jsonl` as the picture is taken. It is *not* read out
  of the PNG. The phone profile has a device scale factor of 2.75, so a 727px page is a 1,999px
  file; both numbers are correct and only one of them is the height. The gallery's first version
  read the file, and reported every phone screen at nearly three times its real size.
- **Full page, not the visible part.** A screenshot cropped to the viewport cannot show that a
  screen is too tall, which is the one thing these pictures are for.
- **The production build**, because that is what the ceiling means. `next dev` renders the same
  markup at a different weight.

Then `npm run gallery` puts all fourteen on one scrollable page, in order, with the height under
each. CI uploads it as the `ui-gate-gallery` artefact and prints the table below into the job
summary. An artefact is a zip of fourteen PNGs, and nobody opens fourteen PNGs one at a time —
which would mean nobody looks, which would leave the gate no better than the checks it exists to
supplement.

## The readings

Taken **30 September 2026**, on the HC-006 branch. Looked at as pictures by John Gallagher and
Claude. Ceilings are in `e2e/shell.spec.ts` and `e2e/mobile.spec.ts`.

**These are the CI readings, and CI is what counts.** A reading taken on a developer's machine is
not the same number — see "The same screen is not the same height everywhere" below.

| Screen | Role | Desktop 1440×1000 | Phone 393×851 | Desktop ceiling | Phone ceiling |
|---|---|---|---|---|---|
| `/login` | signed out | 1,000px | 727px | 1,100px | 1,000px |
| `/not-authorized` (no role) | signed in, no role | 1,000px | 727px | 1,100px | 1,000px |
| `/not-authorized` (wrong domain) | `@gmail.com` | 1,000px | — | 1,100px | — |
| `/` the group ledger | admin | 1,000px ¹ | 980px ¹ | 1,100px | 1,200px |
| `/` with the drawer open | admin | — | 980px | — | 1,200px |
| `/record` | staff | 1,000px | 727px | 1,100px | 1,000px |
| `/money` | finance | 1,000px | 727px | 1,100px | 1,000px |
| `/needs-you` | admin | 1,000px | — | 1,100px | — |
| `/what-happened` | admin | 1,000px | — | 1,100px | — |

¹ **HC-058 changed this screen and these two readings are not yet re-taken.** HC-058 (8 October
2026) changed the colour and edge of one square in the tone key. The square is the same size, so
the heights should not move. They must still be read from the CI run on the HC-058 pull request,
and `04-group-admin.png` and `22-phone-group-admin.png` looked at by a person, before it merges.
The branch was built on a machine where Chromium cannot start, so nobody has seen the new square
yet. Replace this note with the readings and the date they were looked at.

**Every desktop screen reads exactly 1,000px, and that is not a coincidence — it is the viewport.**
Nothing in the product is tall enough to scroll at 1440×1000 yet, so the page height *is* the
window height. That is what an empty Phase 0 should look like, and it means the desktop ceilings
are currently untested by real content. They start earning their keep in Phase 1, when the record
arrives and screens begin to have rows in them. The phone readings are real measurements: 727px
and 980px are both real measurements of content, and both were looked at.

## The same screen is not the same height everywhere

The phone group ledger measures **980px in CI and 954px on a developer's Linux machine** — the same
commit, the same viewport, a 26px difference, about 3%. Everything else agreed exactly.

The cause is fonts. The runner and a local machine do not have the same faces installed, so the
fallback differs, so text wraps at a different word, so a paragraph is one line taller. Nothing is
wrong with either number; they are measurements of two slightly different renderings.

Two things follow, and both matter more than the 26px does:

- **The CI reading is the one recorded here**, because CI is the environment the gate runs in on
  every pull request. A local reading is for looking at a screen, not for writing down.
- **A ceiling set close to its reading will flap.** A screen measured at 980px under a ceiling of
  1,000px would pass locally and fail in CI, which is the kind of red that teaches people to press
  re-run. Leave real headroom. The current ceilings are 100px to 220px above their readings, which
  is roughly ten times the variance seen here.

This is worth re-checking if the product ever pins its own web fonts rather than relying on what
the machine has. That would remove most of the difference, and it is HC-002's `app/globals.css`
question rather than this document's.

**There is no design to render beside these.** CLAUDE.md #11 asks for the comparison "where a
design exists". Holy Corner has none — the branding is fountainbridge's `app/globals.css` carried
over verbatim, and the shell was built from it. The comparison to make instead is the three
products side by side, which is what the group ledger's own copy says it is for and what HC-030
will do properly.

## What the pictures found that nothing else did

Both of these were invisible to lint, typecheck, the unit tests, `design-lint` and the build. Every
one of those checks passed, and every one was right about what it asked.

**1. Two of the five status tones are the same colour.** `ok` and `working` both resolve to
`#1a3b26`. The group ledger prints a key that says "a reader learns a colour here and it means the
same thing on every screen", above two identical green squares with different labels. Filed as
**HC-058**, because changing a brand colour is a design decision and not a line in this pull
request. **Fixed by HC-058:** `working` is now a pale green square with a Bottle Green edge, and a
test on `/` fails if any two of the five swatches are painted the same colour. The companion
change in fountainbridge is still owed.

**2. Half the roles were offered a link to the page they were already reading.** Staff land on
`/record` and finance on `/money`; both sections are unbuilt, so both got a "Back to the record" /
"Back to money" link pointing at the screen in front of them. The link existed, had an `href`, and
that `href` resolved — so nothing could see it but a person with the heading and the link in the
same field of view. **Fixed in this pull request**, with a test that fails without the fix.

The second one is worth dwelling on. It was *introduced* by an earlier fix in this same ticket:
the link used to read "Back to the group" for everybody, which sent staff somewhere they cannot
go, and the repair — send them to their own landing page — is what created the self-link. The
first fault was found by a screenshot and so was the second.

## Adding a line

When a ticket changes a screen:

1. Run `npm run test:e2e`, then `npm run gallery`, then **open
   `e2e/__screenshots__/index.html` and look at it**. This is the step the rule is about. The other
   two are how you get to it.
2. Update the row here with the new reading and the date.
3. If the screen grew past its ceiling, the gate fails and names both numbers. Decide which it is:
   the screen grew and should be cut back, or it genuinely needs the room. If it needs the room,
   move the ceiling **in the same pull request** and say why in the body. A ceiling that moves
   quietly is a ceiling that has stopped doing anything.
