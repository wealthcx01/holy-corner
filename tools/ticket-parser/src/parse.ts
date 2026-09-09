/**
 * Ticket-file parser (FB-004): a `docs/tickets/*.md` file → the bcap-contracts `Ticket` contract.
 *
 * Design goals (from the ticket):
 *  - Tolerant of real variation across repos, not just the ideal template. Two live formats are
 *    supported side by side:
 *      grassmarket — H1 `# GRS-0001 — Title`, metadata as a bullet list (`- **Loop:** 0`,
 *                    `- **Status:** In review`), free-text statuses, letter-suffix ids (GRS-0147b).
 *      fountainbridge — H1 `# FB-004 — Title`, metadata inline (`**Phase:** 1 · **Depends on:** FB-002`).
 *  - Graceful degradation: a malformed ticket parses to a `Ticket` with warnings, never a throw.
 *    Imperfect tickets are shown flagged, never hidden (CLAUDE.md #10, "fail loud").
 *  - Status is a *hint* only. Parse-time default is `todo`; authoritative PR-derived inference is FB-007.
 */

import type {
  ParseContext,
  ParseResult,
  ParseWarning,
  Ticket,
  TicketStatus,
} from './types';

/**
 * A ticket id at the start of a heading or filename.
 *
 * `<PREFIX>-NEW` is accepted deliberately (FB-097). The composer filed everything under that
 * placeholder for weeks, so those files exist — and rejecting them meant the studio counted them as
 * "not tickets" and dropped them off the board entirely, which is a stranger failure than showing
 * them: work a founder asked for, filed successfully, and invisible. They parse, they carry an
 * `unnumbered-id` warning, and the board renders them as unnumbered so they get renamed rather than
 * quietly accumulate.
 */
/**
 * HC-001: the prefix is `[A-Z]{2,}[0-9]*`, NOT `[A-Z]{2,}`, because this estate has a repo whose
 * prefix contains a digit - SD3.
 *
 * Fountainbridge's version required an all-letter prefix, which was true of every prefix it had
 * (FB, GRS, ARCA). It is not true here. HC-015 declares `**Depends on:** HC-014, SD3-0108`, and
 * SD3-0108 is the ticket that decides how Wise is read - the one HC-015 cannot start without.
 * Under the old pattern that dependency parsed to nothing at all: not flagged, not warned about,
 * just gone. A dependency that vanishes silently is the fail-loud rule broken in the quietest
 * possible way (CLAUDE.md #3), on the one field that says what a ticket is waiting for.
 *
 * Caught by this repo's own fixture set on the first run.
 *
 * The first attempt at the fix was `[A-Z][A-Z0-9]+`, and it was too loose: a single letter
 * followed by a digit made `Q1-2026` and `H1-2026` parse as ticket ids. In an advisory firm's
 * repository a quarter label is ordinary prose, and "due after Q1-2026" in a Depends on value
 * would have become a dependency on a ticket that does not exist. `[A-Z]{2,}[0-9]*` takes SD3 and
 * refuses both, because it still demands two letters before any digits.
 *
 * `lib/ticket-drift.ts` MUST use the same pattern. It has its own copy, because the parser is an
 * isolated package with no root dependency, and `test/ticket-drift.test.ts` asserts the two agree
 * on the same inputs so the copies cannot drift apart unnoticed.
 */
const ID_ANCHORED = /^([A-Z]{2,}[0-9]*-(?:\d+[a-z]?|NEW))\b/;
const ID_GLOBAL = /\b[A-Z]{2,}[0-9]*-\d+[a-z]?\b/g;
/** Separators between an id and its title in an H1: em/en dash, hyphen, colon, middot. */
const HEADING_SEP = /\s*[—–\-:·]\s*/;
/**
 * A metadata field: `**Key:** value` (colon inside the bold) OR `**Key**: value` (colon
 * outside — a common author variant). Bullet prefix tolerated. EVERY whitespace run and the key
 * itself are bounded — an unbounded space-matching quantifier next to a space-inclusive key class
 * backtracks catastrophically (ReDoS) on a `**` followed by a long colon-less run. Fully bounded
 * quantifiers keep matching linear regardless of input length. Only the trailing value is open.
 */
const FIELD =
  /^[ \t]{0,16}[-*]?[ \t]{0,4}\*\*[ \t]{0,4}([^*:\n]{1,80}?)[ \t]{0,4}(?::[ \t]{0,4}\*\*|\*\*[ \t]{0,4}:)[ \t]{0,4}(.*)$/;

/**
 * Status vocabulary, checked in precedence order against the leading clause of the status text
 * (the part before the first `—`, `(`, `;`). First group with a keyword hit wins. `todo` is
 * checked before `in-progress` so "not started" doesn't get caught by "started".
 */
const STATUS_RULES: ReadonlyArray<readonly [TicketStatus, RegExp]> = [
  // `withdrawn` and `superseded` are here because `lib/ticket-drift.ts` already treats both as
  // concluded (its FINISHED set), and the two tools reading the same `**Status:**` line must not
  // disagree about what a word means. They did: HC-054 was marked "Superseded by HC-001", which
  // ticket-drift accepted as finished while the parser warned `unrecognized-status` on it.
  // Pinned by a test that walks ticket-drift's whole vocabulary through mapStatus.
  ['done', /\b(done|complete|completed|shipped|merged|closed|fixed|resolved|implemented|delivered|landed|ratified|withdrawn|superseded)\b/],
  ['pr-open', /\b(pr[\s-]?open|in[\s-]?review|under[\s-]?review|awaiting[\s-]?review|ready[\s-]?for[\s-]?review)\b|pr\s*#/],
  ['todo', /\b(todo|to[\s-]?do|backlog|planned|not[\s-]?started|draft|proposed|queued|pending)\b/],
  ['in-progress', /\b(in[\s-]?progress|wip|active|doing|ongoing|building|paused|blocked|on[\s-]?hold|halted|underway|started)\b/],
];

function stripInline(value: string): string {
  return value.replace(/[*`]/g, '').trim();
}

/** Map a free-text status to the contract enum. Returns null if nothing recognizable is found. */
export function mapStatus(raw: string): TicketStatus | null {
  const lead = stripInline(raw)
    .split(/[—–(;]/)[0]
    .toLowerCase()
    .trim();
  if (!lead) return null;
  for (const [status, re] of STATUS_RULES) {
    if (re.test(lead)) return status;
  }
  return null;
}

/** Extract dependency ids from a `Depends on:` value. Best-effort; "none"/"—"/"-" → []. */
export function parseDependsOn(raw: string): string[] {
  const cleaned = stripInline(raw);
  if (!cleaned || /^(none|n\/?a|-{1,2}|—|–)\b/i.test(cleaned)) return [];
  const ids = cleaned.match(ID_GLOBAL) ?? [];
  return [...new Set(ids)];
}

/** Split an H1 into its ticket id (if any) and title. */
function splitHeading(h1: string): { id: string | null; title: string } {
  const text = h1.replace(/^#+\s*/, '').trim();
  const idMatch = text.match(ID_ANCHORED);
  if (!idMatch) return { id: null, title: text };
  const id = idMatch[0];
  const rest = text.slice(id.length).replace(new RegExp(`^${HEADING_SEP.source}`), '').trim();
  return { id, title: rest || text };
}

function fileStem(path: string): string {
  return (path.split('/').pop() ?? path).replace(/\.md$/i, '');
}

function idFromPath(path: string): string | null {
  const m = fileStem(path).match(ID_ANCHORED);
  return m ? m[0] : null;
}

/** Human-ish title from a filename when the file has no usable H1. */
function titleFromPath(path: string, id: string | null): string {
  let slug = fileStem(path);
  if (id && slug.toUpperCase().startsWith(id.toUpperCase())) {
    slug = slug.slice(id.length).replace(/^[-_\s]+/, '');
  }
  const words = slug.replace(/[-_]+/g, ' ').trim();
  if (!words) return id || fileStem(path) || path; // never empty — contract requires minLength 1
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Parse a ticket markdown file into a `Ticket`. Never throws on string content — malformed input
 * yields a best-effort `Ticket` plus `warnings`. Throws only on a missing caller context (a usage
 * error, not a data error), since `repo`/`path` are required contract fields it cannot invent.
 */
export function parseTicket(markdown: string, ctx: ParseContext): ParseResult {
  if (!ctx || !ctx.repo || !ctx.path) {
    throw new TypeError('parseTicket requires a context with non-empty { repo, path }.');
  }
  const warnings: ParseWarning[] = [];
  const src = typeof markdown === 'string' ? markdown : '';
  const lines = src.split(/\r?\n/);

  // --- id + title, from the H1 where possible, else from the filename ------------------------
  const h1Index = lines.findIndex((l) => /^#\s+/.test(l));
  let id: string | null = null;
  let title: string | null = null;

  if (h1Index >= 0) {
    const heading = splitHeading(lines[h1Index]);
    id = heading.id;
    title = heading.title || null;
  } else {
    warnings.push({
      code: 'no-h1',
      message: 'No H1 heading found; id and title derived from the filename.',
    });
  }

  if (!id) {
    const fromPath = idFromPath(ctx.path);
    if (fromPath) {
      id = fromPath;
      if (h1Index >= 0) {
        warnings.push({
          code: 'no-id-in-heading',
          message: 'H1 present but no ticket id in it; id taken from the filename.',
        });
      }
    } else {
      id = fileStem(ctx.path) || ctx.path; // never empty — contract requires minLength 1
      warnings.push({
        code: 'no-id',
        message:
          'No ticket id (e.g. FB-001) found in the heading or filename; this may not be a ticket file.',
      });
    }
  }

  // FB-097: a ticket that never got a real number cannot be referred to, depended on, or approved by
  // name. It parses — dropping it would hide real work — and says loudly that it needs renaming.
  if (/-NEW$/.test(id)) {
    warnings.push({
      code: 'unnumbered-id',
      message: `"${id}" is a placeholder, not a ticket id — this ticket needs a real number before anything can refer to it.`,
    });
  }

  if (!title) {
    title = titleFromPath(ctx.path, id);
    warnings.push({ code: 'no-title', message: 'No title in an H1; derived from the filename.' });
  }

  // --- metadata block: from just after the H1 to the first `## ` section ----------------------
  let phase: string | null = null;
  let branch: string | null = null;
  let dependsOn: string[] = [];
  let statusRaw: string | null = null;

  const start = h1Index >= 0 ? h1Index + 1 : 0;
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    if (/^##\s/.test(line)) break;
    if (!line.trim()) continue;
    // A single physical line may hold several `·`-separated fields (fountainbridge inline style).
    // Only split when the line actually looks inline (≥2 bold fields), so a bullet value that
    // legitimately contains `·` (e.g. "blocked · waiting") isn't silently truncated.
    //
    // HC-001 REPLACED fountainbridge's rule here rather than adding to it.
    //
    // The inherited rule was `boldCount >= 4 && line.includes('·')`: split a line into fields only
    // when it already looks like it holds several. It could not read the multi-repo tickets, whose
    // header wraps and leaves the field after prose:
    //
    //     (`packages/bcap_contracts` only) · **Branch:** `hc-005-...` here and a
    //
    // One bold field, so `>= 4` declined to split, and FIELD is anchored to the start of a line, so
    // `**Branch:**` after the prose matched nothing. HC-005, HC-018, HC-031, HC-035 and HC-052 all
    // parsed their branch as null - a declared value dropped in silence, which is the fail-loud rule
    // broken quietly (CLAUDE.md #3), on the field that says where a ticket's work happens.
    //
    // The replacement asks the question that actually matters: IS THERE ANOTHER FIELD FURTHER ALONG
    // THIS LINE? A bold run ending in a colon, somewhere after a `·`.
    //
    // It SUBSUMES the old rule rather than sitting beside it, and that was measured, not assumed:
    // any line carrying two `**Key:**` fields separated by `·` necessarily has a bold field after a
    // `·`, so this clause fires wherever the old one usefully did. Deleting `boldCount >= 4` left
    // all 55 tests green; deleting this clause turned two red. Keeping a clause that can never
    // change an outcome is the dead code this repository's own standards forbid.
    //
    // It still does NOT fire on `- **Status:** blocked · waiting on HC-002`, where what follows the
    // `·` is prose and truncating it would lose half the status. That case keeps its own test.
    const fieldAfterSeparator =
      /·[^·]*\*\*[^*\n]{1,80}\*\*[ \t]{0,4}:|·[^·]*\*\*[^*\n]{1,80}:[ \t]{0,4}\*\*/.test(line);
    const segments = line.includes('·') && fieldAfterSeparator ? line.split('·') : [line];
    for (const segment of segments) {
      const m = segment.match(FIELD);
      if (!m) continue;
      const key = m[1].trim().toLowerCase().replace(/\s+/g, ' ');
      const value = m[2];
      switch (key) {
        case 'phase':
        case 'loop':
          phase = stripInline(value).replace(/\s*\(.*\)\s*$/, '').trim() || null;
          break;
        case 'depends on':
        case 'depends':
        case 'dependencies':
        case 'deps':
          dependsOn = parseDependsOn(value);
          break;
        case 'branch':
          branch = stripInline(value).split(/\s+/)[0] || null;
          break;
        case 'status':
          statusRaw = value;
          break;
        // Other keys (Owner, Severity, Normative sources, Repo, …) are legitimately common and
        // not part of the contract — ignore them silently rather than warn.
        default:
          break;
      }
    }
  }

  // --- status: absence is normal (default todo); presence-but-unmappable is worth flagging -----
  let status: TicketStatus = 'todo';
  if (statusRaw !== null && statusRaw.trim() !== '') {
    const mapped = mapStatus(statusRaw);
    if (mapped) {
      status = mapped;
    } else {
      warnings.push({
        code: 'unrecognized-status',
        message: `Status "${stripInline(statusRaw)}" did not map to a known lifecycle state; defaulting to "todo".`,
      });
    }
  }

  const ticket: Ticket = {
    id,
    repo: ctx.repo,
    path: ctx.path,
    title,
    phase,
    depends_on: dependsOn,
    status,
    branch,
    pr_url: null,
    body_md: src,
  };

  return { ticket, warnings };
}

/**
 * Heuristic: does this parse look like an actual ticket (vs. a stray README/design note in the
 * directory)? A consumer (FB-006) uses this to decide what to render as a ticket.
 */
export function looksLikeTicket(result: ParseResult): boolean {
  return !result.warnings.some((w) => w.code === 'no-id');
}
