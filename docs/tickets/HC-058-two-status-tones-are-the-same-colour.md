# HC-058 — Two of the five status tones are the same colour

**Branch:** `hc-058-two-status-tones-are-the-same-colour`
**Status:** In progress
**Shipped in part:** the fix and its test are in Holy Corner. The matching change in fountainbridge is not open yet, because this branch could only change this repository.
**Found by:** HC-006, the UI gate, on its first run. Nothing else in the repository could see it.

## What is wrong

`lib/status.ts` defines five status tones and says, in the product's own words on the group ledger:

> One vocabulary, defined once. A reader learns a colour here and it means the same thing on every
> screen.

Two of those five are painted the same colour:

| Tone | CSS token | Resolves to | Hex |
|---|---|---|---|
| `ok` | `--tone-ok` | `--color-ok` | `#1a3b26` |
| `working` | `--tone-working` | `--color-accent` | **`#1a3b26`** |

`app/globals.css:41` and `app/globals.css:52`. Same Bottle Green, twice.

So a reader who learns the colour cannot use it. Green means "it worked, it is healthy, it is
done" and also "under way right now" — which are not the same fact, and on a money screen they are
very much not the same fact. An invoice that is *sent and paid* and an invoice that is *being sent
right now* will be the same colour in the list.

## Why no gate caught it

Every check in this repository passed, and each was right to:

- `design-lint` enforces that components reference `--tone-*` and never a raw colour. They do.
- The unit tests assert five tones exist, each has a meaning, and each maps to a `--tone-*`
  variable. They do.
- The `never` default in the tone switch makes an untoned status a build error. It is.

None of them ask whether two tones *look* different, because none of them look. The fault is a
fact about pixels, and it was found by opening `04-group-admin.png` and seeing two identical
squares above two different labels.

## What to decide

This is a change to the brand palette, which is why it is a ticket and not a line in HC-006's pull
request. `app/globals.css` is fountainbridge's file, carried over verbatim on purpose (CLAUDE.md,
Branding: *"Do not invent a theme"*), and fountainbridge has the same collision. Three options, in
the order they should be considered:

1. **Give `working` its own colour** here, and open the matching change in fountainbridge so the
   three products do not drift. This is the real fix. `working` wants something that reads as
   motion rather than completion — a lighter or desaturated green, or the ink-soft grey.
2. **Distinguish them by form, not colour** — `working` as a hollow or half-filled swatch against
   `ok`'s solid one. Keeps the palette untouched and works for colour-blind readers, who cannot
   use option 1 either.
3. **Drop to four tones**, if `ok` and `working` turn out not to need separating in this product.
   Cheapest, and it has to be argued rather than assumed.

Option 2 is worth taking on its own merits regardless of which colour decision is made: five
colours is already more than a colour-blind reader can separate.

## Scope

- Decide between the three options above. Record it in `docs/design-contract.md`.
- Apply it in `app/globals.css` and, if the palette changed, open the companion change in
  fountainbridge.
- Add the check that would have caught this: a test that reads the five `--tone-*` values from the
  rendered page and asserts no two are equal. It belongs next to the UI gate, because it is the
  same kind of question.
- Re-screenshot `/` at both sizes and update `docs/design-conformance.md`.

## Decision (8 October 2026, approved by John Gallagher)

Options 1 and 2 together, with no new colour.

- **Colour.** `--tone-working` now points at `--color-accent-tint` (`#e4eae3`), the pale Bottle
  Green already in the palette. No hex value was invented or changed.
- **Shape.** The `working` swatch has a 1px Bottle Green edge, so it reads as a hollow square
  beside `ok`'s solid one. That works for a reader who cannot see colour well.
- **Option 3 was turned down.** "Paid" and "being sent" are different facts on a money screen.
- **The ink-soft grey was turned down.** It is too close to `idle`'s grey and reads as "nothing
  happening".

The reasons are written up in `docs/design-contract.md`, section 2. The pale green is a fill and
must never be used as a text colour.

Left alone on purpose: `.mark-working`, `.engine-dot` and `.engine-run-mark.tone-working` in
`app/globals.css` came over from fountainbridge and are not used anywhere in Holy Corner. If a
later ticket starts using them, they will show the pale fill without the green edge. The
fountainbridge change is the right place to give them the edge.

**Still to do before this ticket is Done:**

- A person opens `04-group-admin.png` and `22-phone-group-admin.png` from the CI run on this
  ticket's pull request and confirms the two squares look different. Chromium cannot start on the
  machine this was built on, so nobody has seen the new square yet, and the new test has not been
  seen to fail on the old colours and pass on the new ones. CI runs it.
- Record the two `/` heights from that run in `docs/design-conformance.md`.
- Open the matching change in fountainbridge and link it here.

## Acceptance criteria

- [x] No two of the five tones resolve to the same colour, and a test says so by reading the
      rendered values rather than the stylesheet source. (`e2e/shell.spec.ts`, "no two status
      tones look the same". Runs in CI; Chromium cannot start on the machine it was written on.)
- [ ] `ok` and `working` can be told apart in `04-group-admin.png` at 1440×1000 and in the phone
      shot at 393×851, by a person looking.
- [x] `docs/design-contract.md` records which option was taken and why.
- [ ] If the palette changed, the companion fountainbridge change is open and linked here.
