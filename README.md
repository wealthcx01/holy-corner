# Holy Corner — Bruntsfield OS

The internal hub where Bruntsfield Capital's Executive Management team sees the whole group:
every vertical (Advisory / grassmarket, Foundry / fountainbridge, Clients / viewforth), every
contract, every invoice and receipt, every commission owed and owing, and every decision waiting on
a person. Admin-only. Planned home: `os.bruntsfieldcapital.com`.

## Read first

1. `CLAUDE.md` — the non-negotiables. Follow it exactly.
2. `docs/holy-corner-plan.md` — decisions D1–D10 and the phases. Normative.
3. `docs/commercial-record.md` — the contracts and invoices the system holds on day one.
4. `docs/tickets/` — HC-001 onwards, in dependency order (the plan lists it).
5. `docs/source/` — the February 2026 PRD and concept summary. Historical; the plan wins.

## Conventions

- Tickets live in `docs/tickets/` as `HC-nnn-slug.md`. One ticket = one branch (`hc-nnn-slug`) =
  one PR. Merge on green + `/review`. Never `--no-verify`.
- External actions (send, email, pay, deploy) gate on a recorded human approval. Always.
- Built with gstack (`/plan-ceo-review`, `/review`, `/qa`, `/ship`, `/retro`); gbrain holds the
  lane's memory.
- Branding is fountainbridge's `globals.css`. Do not invent a theme.
- Look at every screen in a browser, at desktop and phone size, before saying it works.

## Running it locally

The app arrives with HC-002. Until then this repo is docs and tickets. When it exists: Node 22,
`npm ci` (never `npm install`), `cp .env.example .env.local`, `npm run dev`. Every variable the app
reads is named in `.env.example`.

## Where things are

| Where | What |
|---|---|
| `C:\dev\holy-corner` | local working copy (John's machine) |
| `~/projects/holy-corner` on the dev VM (`ssh claudedev`) | the lane's working copy |
| `wealthcx01/holy-corner` (private) | the repo of record |
| `elite-vault/` (gitignored) | read-only reference copy of the LabCI Elite Vault project the core is adapted from |
| `C:\dev\Grassmarket` / `~/projects/grassmarket` | the Advisory Studio, and `packages/bcap_contracts` |
| `C:\dev\fountainbridge` / `~/projects/fountainbridge` | the Foundry Studio, and the design tokens |
