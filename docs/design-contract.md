# The design contract

**HC-002.** What every Holy Corner screen must obey, so that the hub, the Advisory Studio and the
Foundry Studio read as ONE product. To the people using them they are one product: the same person
opens the hub to see what is owed, then opens a studio to act on it. Applies to `app/` and
`components/`, and `make design-lint` enforces the parts a reviewer would otherwise have to catch by
eye, every time, forever.

Adopted from fountainbridge's `docs/studio-design-contract.md` (FB-057). Amend there first where a
rule is shared; the differences for this repository are listed at the end.

This is discipline, not a look. It does not tell you what to design. It tells you what not to
reinvent.

## 1. Tokens only

Every colour, type size and radius comes from `app/globals.css` — the single source of truth, copied
from fountainbridge and grassmarket and **not invented** (plan D3, and CLAUDE.md's branding rule:
*do not invent a theme*).

A component never writes a raw value. `#1a3b26` in a component is a colour that will drift from the
brand the first time the brand moves; `13px` is a value someone chose because it looked right in one
place, which is how six sizes become fourteen.

**The one exception is `1px`.** The hairline rule is an atom of this design system — the whole
paper/ink aesthetic is built from 1px borders — so tokenising it buys a `var()` and no clarity.

### The type scale

The complete scale. If the size you want is not here, the answer is to use the nearest one, not to
add a value inline.

| Token | Size | For |
| --- | --- | --- |
| `--fs-display` | clamp 56–96px | The landing statement |
| `--fs-h1` | clamp 36–56px | Page title |
| `--fs-h2` | clamp 26–34px | Section |
| `--fs-h3` | 22px | Sub-section |
| `--fs-h4` | 18px | Card heading |
| `--fs-subhead` | 15px | Titles *inside* a card — repo names, department names |
| `--fs-body` | 16px | Prose |
| `--fs-body-sm` | 14px | Secondary text, list rows |
| `--fs-meta-lg` | 13px | Supporting detail — check results, next steps |
| `--fs-meta` | 12px | Timestamps, ids, machine values |
| `--fs-eyebrow` | 11px | Kickers, ticket ids on cards |

Layout distances are `rem`, not `px` — they scale with the founder's browser text-size setting, and
a founder who has bumped their default size gets a studio that follows.

## 2. One status vocabulary

Five tones, defined in `lib/status.ts`, wired to colour in `globals.css` as `--tone-*`.

| Tone | Means | Reads as |
| --- | --- | --- |
| `ok` | it worked / healthy / done | bottle green |
| `working` | under way right now | pale green, Bottle Green edge (hollow square) |
| `attention` | needs a human, or a next step the founder must take | amber |
| `blocked` | it failed, or cannot proceed | red |
| `idle` | nothing is happening, or we do not know | grey |

**Why `working` is pale green with a Bottle Green edge (HC-058).** `ok` and `working` used to be
the same Bottle Green, `#1a3b26`. A reader could not tell "done" from "under way", and on a money
screen those are different facts: an invoice that is paid and an invoice that is being sent would
look the same. The UI gate's first screenshot showed two identical squares above two different
labels.

The fix uses two existing things together, and adds no new colour:

- **Colour.** `--tone-working` now points at `--color-accent-tint` (`#e4eae3`), the pale Bottle Green
  already in the palette. It reads as the same family as `ok`, but clearly lighter: on its way, not
  finished.
- **Shape.** The `working` mark has a 1px Bottle Green edge, so it reads as a hollow square beside
  `ok`'s solid one. A reader who cannot see colour well can still tell them apart.

Two options were turned down. Dropping to four tones would merge "paid" and "being sent", which the
invoices and approvals work needs to keep apart. The ink-soft grey the ticket suggested sits too
close to `idle`'s grey and reads as "nothing happening", the opposite of "working".

**`--tone-working` is a fill colour. Never use it to colour text.** Pale green on paper cannot be
read. A domain that needs to say "working" in words uses ink, with the mark beside it.

The matching change in fountainbridge is still owed. fountainbridge has the same collision, and
until it takes the same fix, this one line of `globals.css` no longer matches its copy.

Every domain status — CI conclusions, ticket columns, approval states, lane faults — maps onto these
through a function in `lib/status.ts`. A component asks for a tone and calls `toneColor(tone)`; it
never names `--color-warn` directly. That indirection is the entire point: a founder learns amber
once, and it means the same thing on the board, the queue and the activity feed.

Two rules that fall out of this, and matter more than they look:

- **`attention` is not a failure.** It is amber because a *human* is the next step — an approval to
  grant, a credential to install. Dressing a real fault in amber to seem calmer breaks the founder's
  ability to triage, and violates non-negotiable 10.
- **An unclassified fault reads `blocked`.** When we do not know what went wrong, we say so loudly.
  `laneErrorTone` tones only the two *known* setup states as `attention`; everything else is red.
- **Red is for a fault nobody on the venture can clear** — a stalled machine, a read that will not
  come good on its own, a grant the studio cannot verify. **Anything a founder can end by deciding is
  amber**, however large the number on it.

  Added by FB-211, because a surface over its spending limit rendered red on the desk and in the
  rail. It is not a fault: it is the single most decidable thing on the screen, and it belongs in the
  same colour as the banner at the top of the page that says so. The test is not how bad it is — it
  is whether a founder reading it can end it.

Adding a sixth tone means the founder has a new colour to learn. That is a design decision — it
belongs in a PR to this document, not in a component.

## 3. Machine values in mono

Anything the founder could paste into a terminal or a URL bar — repo names, ticket ids, branch names,
timestamps, counts — uses `--font-mono` (the `.mono` class). Prose does not. This is how a founder
tells at a glance what is a name they must type exactly and what is us talking to them.

## 4. No dead UI

Every control does something real. A `<button>` must have an `onClick`, a `type="submit"`, or a
`form` — or be honestly `disabled`. A feature that is not built yet says so in words (as the
composer entry does when a venture has no box yet); it does not render a button that shrugs.

This is a trust property, not a tidiness one. A founder who clicks a button that does nothing learns
that the studio might be lying elsewhere too.

## Enforcement

```bash
make design-lint                     # the gate CI runs
node scripts/design-lint.mjs --list  # the rules, with the reason for each
```

| Rule | Catches |
| --- | --- |
| `raw-colour` | a hex colour outside `globals.css` |
| `raw-px` | any px except the `1px` hairline |
| `raw-status-colour` | `--color-ok/warn/error` named directly instead of through a tone |
| `dead-control` | a `<button>` that dispatches nothing |

What the linter deliberately does **not** check: spacing rhythm, hierarchy, whether a screen is
*good*. Those need an eye — `/design-review` and `/review`. The linter's job is to stop the
mechanical decay so review can spend its attention on the things only a person can see.


## Reading the screenshot gallery (FB-074)

The gallery is produced with Playwright's `fullPage: true`, which **stitches** a tall image out of a
scrolling page. A `position: sticky` element — the studio header — is rendered at the position it
occupied during that scroll, so on any page long enough to scroll it appears **in the middle of the
image, drawn over the text.**

That is an artifact of the screenshot. It does not happen in a browser.

This cost an afternoon and an 800-word ticket once. Before treating a gallery image as evidence about
the product, ask the browser:

```js
// scrolled to the middle of a real viewport, compare boxes
const bar = document.querySelector('.topbar').getBoundingClientRect();
[...document.querySelectorAll('p, li, h1, h2, h3')]
  .filter((el) => { const b = el.getBoundingClientRect();
                    return b.height > 0 && b.top < bar.bottom && b.bottom > bar.top; });
```

An empty result means nothing is covered. **A screenshot is evidence about a screenshot.**


## What differs in this repository

Three things, each for a stated reason.

**The `lib/brand.ts` exemption is not ported.** Fountainbridge lets one file besides `globals.css`
hold raw colour values, because an installable web app's manifest and `theme-color` meta tag are
read by iOS and Android rather than by CSS, so they need a literal. Holy Corner is an internal
browser surface that nobody installs to a home screen. If that changes, the exemption comes back
*with* the test fountainbridge keeps beside it, asserting the literals still equal the tokens they
copy. An exemption without that test is a hole.

**`docs/design-conformance.md` does not exist yet.** HC-006 creates it, along with the Playwright UI
gate that fills it in. Until then the screen readings live in the pull request that made them, and
the pull request says so rather than implying a scorecard exists.

**There is no Claude Design artefact for Holy Corner.** Fountainbridge compares every screen against
a working prototype. Here there is nothing to compare against, so until HC-030 produces one, the
"design" side of the comparison is the matching screen in one of the two studios. That is weaker and
it is stated plainly rather than dressed up: a screen compared against a sibling is checked for
consistency, not for whether it is the right screen.

## Where the tokens came from, and the one class that was changed

`app/globals.css` is fountainbridge's file verbatim, followed by a marked section of the reusable
classes grassmarket has and fountainbridge has never needed: `.callout`, `.stat-value`,
`.stat-label`, `.measure`, `.btn-secondary`, `.btn-ghost` and `--field-control-height`.

One line was dropped in the copy. Grassmarket's `.callout` opens with `border-radius: var(--radius)`.
That token does not exist here and must not be added: fountainbridge retired `--radius-*` in FB-124
when it adopted the hairline system, and every corner in this design is square. A rounded callout
would be the single rounded thing on every screen it appeared on.
