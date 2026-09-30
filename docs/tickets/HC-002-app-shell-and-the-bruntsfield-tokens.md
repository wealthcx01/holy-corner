# HC-002 — App shell: Next.js, the Bruntsfield tokens, the top bar, design-lint, the glossary

**Status:** Done · **Phase:** 0 · **Depends on:** HC-001 · **Repo:** holy-corner ·
**Branch:** `hc-002-app-shell-and-the-bruntsfield-tokens` · One ticket = one branch = one PR.

## Why this matters (for John)

Holy Corner has to look like the same product as the Advisory Studio and the Foundry Studio, because
to the people using it, it is. Both studios draw from one CSS file of tokens copied from the
Bruntsfield website: paper and ink, one Bottle Green, three typefaces, five status tones. This
ticket puts that file here unchanged and adds the lint that stops anyone drifting from it.

## Context

- fountainbridge `app/globals.css` (287 lines) and grassmarket `frontend/app/globals.css` (673 lines)
  carry the same `:root` block. Neither uses Tailwind; components use CSS classes and
  `var(--color-*)`. Introducing Tailwind here would fork the brand. Do not.
- fountainbridge `lib/status.ts` maps the five tones (`--tone-ok / working / attention / blocked /
  idle`); components never name `--color-ok|warn|error` directly. `scripts/design-lint.mjs` enforces
  four rules: no raw hex outside globals.css, no px except `1px`, no raw status colour, no dead button.
- fountainbridge `app/layout.tsx` is the whole shell: `next/font/google` for Source Serif 4, Inter,
  IBM Plex Mono; a sticky `.topbar` with a two-line wordmark and four nav pills; `<main className="main">`.
  grassmarket's `AppChrome` + `PrimaryNav` is the same idea with a mobile drawer under 768px.
- Elite Vault's sidebar grouping (AI Inbox / Commercial / Delivery / Analytics / Admin) is the
  information architecture to carry, as top-nav sections, not a sidebar.

## Scope

- The Next.js app by hand: App Router, TypeScript strict, npm, Node 22, ESLint,
  `npm run lint | typecheck | test | build | dev`. vitest with the `server-only` alias trick from
  fountainbridge's `vitest.config.ts`, and `app/**/*.test.ts` in the include from day one.
- `app/globals.css` copied from fountainbridge verbatim, plus grassmarket's reusable classes that
  fountainbridge lacks (`.callout`, `.stat-value`, `.stat-label`, `.measure`, `.btn-secondary`,
  `.btn-ghost`, `--field-control-height`). The header comment names both sources and says "do not
  invent".
- `app/layout.tsx`: fonts, the top bar with wordmark **Bruntsfield / OS** (eyebrow style like
  grassmarket's `ADVISORY`), nav sections **The group · The record · Money · Needs you · What
  happened**, an account menu, `<main>`. Mobile drawer under 768px. Nav is a function of role
  (HC-003 fills it in; here it renders for a stub session).
- `lib/status.ts` and `scripts/design-lint.mjs` ported; `make design-lint` wired to the "Design
  contract" job. `docs/design-contract.md` copied from fountainbridge's `studio-design-contract.md`.
- `lib/glossary.ts`: the reader-facing vocabulary. "Needs you" not "pending approvals"; "the record"
  not "the database"; "owed to us" and "we owe" not "AR/AP"; "sent" not "dispatched"; "the Advisory
  Studio" and "the Foundry Studio" not grassmarket and fountainbridge.
- `app/api/health/route.ts` (public, dumb, for Railway) and a placeholder `/` that renders the shell.

## Out of scope

- Sign-in (HC-003), data (HC-004), any real screen, copy-lint (HC-009).

## Acceptance criteria

- [x] `npm run build` passes; the shell renders at `/` with the wordmark, nav and fonts loaded.
- [x] `make design-lint` passes (9 files clean), and fails on a fixture component with a raw
      `#hex` — proved by adding one and watching the build go red, then removing it.
- [x] Rendered beside fountainbridge's `/login` and grassmarket's `/login` at 1440×1000 and
      393×851. Same paper, same Bottle Green, same three typefaces. Heights in the PR.
- [x] No Tailwind, no CSS-in-JS, no second font source. `next/font/google` self-hosts all three
      faces at build time, so no request leaves the page for a font.

## Verification

`/review` + `/qa` + the side-by-side screenshots.
`npm run lint && npm run typecheck && npm test && make design-lint`.


## What looking at the screen turned up

Three things, none of which any automated gate can see. This is the ticket where CLAUDE.md #11
starts doing work, and it earned its place on the first screen.

**FB-124, reproduced.** The top bar offers five sections and four of them had no page. Next.js
prefetches nav destinations, so every page load fired four 404s before anyone clicked anything.
That is fountainbridge's *"dead nav row 404-ing on every page load"* exactly, the defect CLAUDE.md
#11 was written about, arrived at independently and within an hour of the navigation existing.

The fix is an honest page per section saying what it will hold and which ticket builds it. Hiding
the four links until their tickets land was the obvious alternative and it is worse: the sections
ARE the shape of this product, and a navigation that grows one item at a time never gets judged as
a whole. A reader should be able to see where things will be.

**The same three words, three times, inside 180 pixels.** The bar carried an eyebrow reading
"Bruntsfield OS" a few centimetres from where the wordmark already said it, and the page heading
said it again. Fountainbridge's equivalent eyebrow says "Foundry Studio" beside a wordmark reading
"Bruntsfield / Foundry", so it adds a word; ours repeated one. The eyebrow is gone and the top bar
now reads wordmark, sections, account.

**A wordmark that read as truncated.** Fountainbridge stacks BRUNTSFIELD over FOUNDRY and
grassmarket over ADVISORY, and both second lines are long enough to sit under the first as one
mark. "OS" is two characters, and stacked plain under an eleven-character word it looked like a
subtitle that had been cut off rather than part of a lockup. It now sits under the hairline rule
the Bruntsfield sign-in lockup already uses (FB-189: *a serif caps wordmark over a hairline rule*).

**This is still the weakest comparison in the project and the pull request says so.** There is no
Claude Design artefact for Holy Corner, so the "design" side was the matching screen in each
sibling studio. That checks whether the three read as one product. It does not check whether this
is the right screen. HC-030 produces the first real design artefact.

## The readings

| Screen | Desktop 1440×1000 | Phone 393×851 |
|---|---|---|
| `/` | 1,000px | 954px |
| `/money` (a placeholder section) | 1,000px | 851px |
| fountainbridge `/login`, for comparison | 1,000px | 851px |
| grassmarket `/login`, for comparison | 1,000px | 851px |

Neither Holy Corner screen drags sideways at 393px, and neither logs a console error. The drawer
opens on a phone and all five of its links navigate, checked one at a time rather than assumed.
