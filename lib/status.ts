/**
 * Holy Corner's ONE status vocabulary. Ported from fountainbridge `lib/status.ts` (FB-057).
 *
 * Before fountainbridge had this, every surface picked its own colour with an inline ternary: a
 * failed run was red on one screen, a stale lane amber on another, each decided locally, none
 * agreeing on what a colour MEANT. That is what makes a product read as a patchwork.
 *
 * Five tones, defined once, and every domain status maps onto one of them. A person learns the
 * colour once and it holds on every screen. Components ask for a tone and never name a colour;
 * `scripts/design-lint.mjs` fails the build if one does.
 *
 * WHAT WAS DELIBERATELY NOT PORTED: fountainbridge's mappers (`ciRunTone`, `prCiTone`,
 * `ticketTone`, `approvalTone`, `laneErrorTone`). Each takes a type from its own domain - CI runs,
 * pull requests, venture tickets - and none of those types exist here. Copying them would mean
 * hand-authoring the types they need, which is the cautionary tale CLAUDE.md #6 names by file.
 *
 * Each Holy Corner domain adds its own mapper, in the ticket that introduces the domain, following
 * the shape below: a `switch` with a `never` default, so adding a status to a contract without
 * toning it is a BUILD error rather than a silently grey row. HC-042 brings the first one, for the
 * approval event log.
 */

/**
 * The whole vocabulary. Adding a sixth tone is a design decision, not an implementation detail: it
 * means a reader has a new colour to learn. It belongs in a pull request to
 * `docs/design-contract.md`, not in a component.
 */
export const TONES = ['ok', 'working', 'attention', 'blocked', 'idle'] as const;
export type Tone = (typeof TONES)[number];

/** What each tone means. Also the source for the contract doc's table, kept next to the code. */
export const TONE_MEANING: Record<Tone, string> = {
  ok: 'it worked, it is healthy, it is done',
  working: 'under way right now',
  attention: 'needs a person, or a next step somebody has to take',
  blocked: 'it failed, or it cannot proceed',
  idle: 'nothing is happening, or we do not know',
};

/**
 * The CSS custom property for a tone. Components use this instead of naming a colour, which is how
 * one vocabulary stays one vocabulary: re-tone the whole product by editing `app/globals.css`
 * rather than thirteen files.
 */
export function toneColor(tone: Tone): string {
  return `var(--tone-${tone})`;
}

/**
 * The rule that matters most here, written down where the next domain will look.
 *
 * "Could not be read" is NOT `ok`, and it is not `idle` either. A source Holy Corner failed to
 * reach is a fact about the hub, not a calm state of the thing it was asking about. Painting it
 * green is the product reporting health it never checked, on the one screen used to decide where
 * to look (FB-136 had to add exactly this, and HC-030 inherits the rule).
 */
export const UNREADABLE_TONE: Tone = 'idle';
