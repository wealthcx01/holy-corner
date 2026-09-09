# HC-041 — The composer: ask the record, see every action it takes

**Status:** Todo · **Phase:** 3 · **Depends on:** HC-042, HC-030 · **Repo:** holy-corner ·
**Branch:** `hc-041-the-composer` · One ticket = one branch = one PR.

## Why this matters (for John)

Both studios have a conversational front: fountainbridge's LibreChat composer with MCP tools that
file tickets, deposit facts and search the venture brain; grassmarket's ports waiting for a Claude
adapter. Holy Corner's version answers "what is the status of the OpenBB deal", "what did we invoice
in August", "what is waiting on me", and can propose a record — but every tool call is shown as a
visible action with its real outcome, because FB-062's composer told a founder it had filed a ticket
it had not.

## Context

- fountainbridge `lib/composer.ts` and `app/api/composer/[id]/route.ts`: a streaming proxy so the
  key never reaches the browser; authorise before a byte leaves; the same 403 for "not yours" and
  "no such"; tool calls rendered as `ComposerAction` labels; three undocumented LibreChat behaviours
  documented in the header (tool chunks with inconsistent indices, carry the transcript, mangled tool
  names). Its `seed-agent.js` uses `claude-sonnet-5`; memory extraction uses
  `claude-haiku-4-5-20251001`; `execute_code` is deliberately excluded.
- Here there is no LibreChat box: the composer calls the Anthropic SDK directly with tool use
  (ADR-0001), server-side, with read tools over the repository (scoped by the caller's principal)
  and propose tools that create HC-042 proposals. No tool executes an external action.
- `docs/jstack-bruntsfield-method.md` (fountainbridge) for the plain-language card the composer
  emits when it proposes something.

## Scope

- `app/api/composer/route.ts`: streaming, `runtime = nodejs`, authorise first, tool loop with
  `claude-sonnet-5`, transcript carried per turn, every tool call and result persisted on a
  `composer_turns` row.
- Tools (read, scoped): organisations, contracts and terms, invoices, ledger, partner deals,
  the group ledger rows, needs-you, what-happened. Tools (propose): each inbox proposal kind
  (HC-040), rendered as the plain-language card with approve/refuse.
- `components/Composer.tsx`: a drawer on every screen, actions rendered as visible rows with their
  outcome, "AI-drafted" label on every answer, a "show me where that came from" link per fact
  (the tool result that produced it).
- Memory: conversation summaries to gbrain (HC-045) with the background model, never to the model
  context of another person.

## Out of scope

- Any tool that sends, pays, or writes to a studio. Voice. Anything on a client-facing surface.

## Acceptance criteria

- [ ] "What is waiting on me" returns the needs-you list for the caller's role only; a `finance`
      caller never sees Foundry items through the composer (tested through the tool layer).
- [ ] "Register that OpenBB paid INV-001 today" produces a proposal card, not a payment; approving
      the card records it; the transcript shows the tool call and the card.
- [ ] A tool result that fails renders as a failed action, and the model's text cannot claim it
      succeeded (the action row is authoritative, rendered from the result, not the prose).
- [ ] The key is absent from every client bundle; the route refuses an unauthenticated stream.
- [ ] Drawer at both sizes.

## Verification

`/review` with security on, `/qa`. A recorded stream fixture drives the UI gate (the fountainbridge
`COMPOSER_FIXTURE` pattern).
