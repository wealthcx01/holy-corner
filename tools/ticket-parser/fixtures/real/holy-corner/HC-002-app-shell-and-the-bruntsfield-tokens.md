# HC-002 — App shell: Next.js, the Bruntsfield tokens, the top bar, design-lint, the glossary

**Status:** Todo · **Phase:** 0 · **Depends on:** HC-001 · **Repo:** holy-corner ·
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

- [ ] `npm run build` passes; the shell renders at `/` with the wordmark, nav and fonts loaded.
- [ ] `make design-lint` passes, and fails on a fixture component with a raw `#hex`.
- [ ] Rendered beside fountainbridge's `/login` and grassmarket's `/login` at 1440×1000 and
      393×851: same paper, same green, same type. Four screenshots in the PR with heights.
- [ ] No Tailwind, no CSS-in-JS, no second font source.

## Verification

`/review` + `/qa` + the side-by-side screenshots.
`npm run lint && npm run typecheck && npm test && make design-lint`.
