import type { Db } from '@/lib/db/driver';
import type { Principal } from '@/lib/authz';
import {
  contentHashOf,
  sign,
  signGrant,
  verify,
  verifyGrant,
  type Signable,
} from './signing';

/**
 * The approval gate. Proposed, granted, executed, on an append-only signed log.
 *
 * Nothing external happens without a person saying yes, and the yes is a record nobody can forge or
 * lose. Plan D7, CLAUDE.md #2 and #5, and the reason HC-042 is built in Phase 0 rather than Phase 3:
 * every Phase 1 proposal uses it.
 *
 * ## The one load-bearing property
 *
 * `execute` is the ONLY code path that performs an external action, and it refuses unless it has
 * read a granted event whose attestation verifies and whose content hash matches the payload it is
 * about to act on. Every other property here exists to protect that one.
 *
 * ## What each check stops, concretely
 *
 * - **Append-only, enforced in the database.** An audit trail the audited party can edit is worse
 *   than none, because it is believed. A decision that changed is a new event.
 * - **Only a human grants.** An agent that can grant its own proposal is the gate removed. A
 *   self-declared actor is not authorisation.
 * - **Every event is signed, and one that does not verify is REFUSED AND COUNTED.** Skipping it
 *   quietly would leave a trail that looks complete and is not.
 * - **A grant is bound to a content hash.** Without it, "approve this payment of five hundred"
 *   can become five thousand between the yes and the doing, and the log would still read clean.
 */

export type ApprovalEventType =
  | 'approval.proposed'
  | 'approval.granted'
  | 'approval.rejected'
  | 'action.executing'
  | 'action.executed'
  | 'action.failed';

export type ActorKind = 'human' | 'agent' | 'executor';

export type ProposalStatus =
  | 'proposed'
  | 'granted'
  | 'rejected'
  | 'executing'
  | 'executed'
  | 'failed'
  | 'unverified';

export interface StoredEvent {
  seq: number;
  scope: string;
  proposalId: string;
  type: ApprovalEventType;
  at: string;
  actorKind: ActorKind;
  actorId: string;
  data: Record<string, unknown>;
  contentHash: string | null;
  attestation: string | null;
}

export class ApprovalRefused extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApprovalRefused';
  }
}

/** The one code path that performs an external action. Registered per proposal kind. */
export type Executor = (payload: Record<string, unknown>) => Promise<Record<string, unknown>>;

export interface ExecutorRegistry {
  readonly [kind: string]: Executor;
}

const secret = (): string => process.env.HC_APPROVAL_SECRET ?? '';

function toSignable(e: StoredEvent): Signable {
  return {
    v: 1,
    seq: e.seq,
    scope: e.scope,
    proposalId: e.proposalId,
    type: e.type,
    at: e.at,
    actorKind: e.actorKind,
    actorId: e.actorId,
    data: e.data,
    contentHash: e.contentHash,
  };
}

function rowToEvent(r: Record<string, unknown>): StoredEvent {
  return {
    seq: Number(r.seq),
    scope: String(r.scope),
    proposalId: String(r.proposal_id),
    type: String(r.type) as ApprovalEventType,
    // Normalised to an ISO string, because that is what was signed. A Date object formatted by a
    // different driver is a different string and would fail to verify for no real reason.
    at: new Date(r.at as string).toISOString(),
    actorKind: String(r.actor_kind) as ActorKind,
    actorId: String(r.actor_id),
    data: (r.data ?? {}) as Record<string, unknown>,
    contentHash: r.content_hash === null ? null : String(r.content_hash),
    attestation: r.attestation === null ? null : String(r.attestation),
  };
}

/**
 * Append one event, signed.
 *
 * `seq` is part of what gets signed, so it has to be known BEFORE the row is written. The obvious
 * shape - insert, read back the generated `seq`, then update the row with its attestation - cannot
 * work here at all: the append-only rule silently discards that UPDATE, and the event would sit in
 * the log for ever with a null attestation, which reads as forged.
 *
 * So the sequence number is taken first with `nextval`, which is atomic and never hands the same
 * number to two callers, and the row is inserted once, complete. No lock, no race, and nothing
 * afterwards that the database is going to refuse.
 */
async function append(
  db: Db,
  e: Omit<StoredEvent, 'seq' | 'attestation'>,
): Promise<StoredEvent> {
  // Take the sequence number FIRST, so the attestation can cover it. `nextval` is atomic and never
  // hands the same number to two callers, which is the property that makes this safe without a lock.
  const { rows } = await db.query("SELECT nextval('approval_events_seq_seq') AS seq");
  const seq = Number(rows[0].seq);
  const event: StoredEvent = { ...e, seq, attestation: null };
  const attestation = sign(toSignable(event), secret());

  await db.query(
    `INSERT INTO approval_events
       (seq, scope, proposal_id, type, at, actor_kind, actor_id, data, content_hash, attestation)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)`,
    [
      seq,
      e.scope,
      e.proposalId,
      e.type,
      e.at,
      e.actorKind,
      e.actorId,
      JSON.stringify(e.data),
      e.contentHash,
      attestation,
    ],
  );
  return { ...event, attestation };
}

/** Every event for one proposal, in log order. */
export async function eventsFor(db: Db, proposalId: string): Promise<StoredEvent[]> {
  const { rows } = await db.query(
    `SELECT seq, scope, proposal_id, type, at, actor_kind, actor_id, data, content_hash, attestation
       FROM approval_events WHERE proposal_id = $1 ORDER BY seq`,
    [proposalId],
  );
  return rows.map(rowToEvent);
}

export interface Projection {
  readonly id: string;
  readonly scope: string;
  readonly status: ProposalStatus;
  readonly proposedBy: string | null;
  readonly decidedBy: string | null;
  readonly contentHash: string | null;
  /** Events whose attestation did not verify. Counted and shown, never silently skipped. */
  readonly refusedEvents: number;
  readonly payload: Record<string, unknown>;
}

/**
 * Replay a proposal's log into its current state.
 *
 * THE LOG IS THE TRUTH; the `proposals` table is a convenience. A test asserts that replaying every
 * log reproduces that table exactly, and if the two ever disagree the log wins.
 *
 * An event that does not verify does NOT advance the state. It is counted instead, and a proposal
 * with a refused event among its decisions reads `unverified` rather than reading as though the
 * decision never happened: "somebody tried to write a grant we cannot vouch for" and "nobody has
 * decided yet" are different facts and must not look the same.
 */
export function project(events: readonly StoredEvent[]): Projection | null {
  if (events.length === 0) return null;
  const s = secret();
  let status: ProposalStatus = 'proposed';
  let proposedBy: string | null = null;
  let decidedBy: string | null = null;
  let contentHash: string | null = null;
  let payload: Record<string, unknown> = {};
  let refusedEvents = 0;
  let sawUnverifiedDecision = false;

  for (const e of [...events].sort((a, b) => a.seq - b.seq)) {
    if (!verify(toSignable(e), e.attestation, s)) {
      refusedEvents += 1;
      // A refused PROPOSAL leaves nothing to show; a refused DECISION is the dangerous one, because
      // ignoring it would render as "still waiting on you" while somebody has tried to force a yes.
      if (e.type !== 'approval.proposed') sawUnverifiedDecision = true;
      continue;
    }
    switch (e.type) {
      case 'approval.proposed':
        proposedBy = e.actorId;
        payload = e.data;
        contentHash = e.contentHash;
        status = 'proposed';
        break;
      case 'approval.granted':
        decidedBy = e.actorId;
        status = 'granted';
        break;
      case 'approval.rejected':
        decidedBy = e.actorId;
        status = 'rejected';
        break;
      case 'action.executing':
        status = 'executing';
        break;
      case 'action.executed':
        status = 'executed';
        break;
      case 'action.failed':
        status = 'failed';
        break;
    }
  }

  const first = events[0];
  return {
    id: first.proposalId,
    scope: first.scope,
    status: sawUnverifiedDecision ? 'unverified' : status,
    proposedBy,
    decidedBy,
    contentHash,
    refusedEvents,
    payload,
  };
}

/** Propose something. The payload is hashed now, and a grant will bind itself to that hash. */
export async function propose(
  db: Db,
  args: {
    scope: string;
    kind: string;
    subject: string;
    payload: Record<string, unknown>;
    actorKind?: Exclude<ActorKind, 'executor'>;
    actorId: string;
  },
): Promise<StoredEvent> {
  const id = `${args.scope}#${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const at = new Date().toISOString();
  const contentHash = contentHashOf(args.payload);

  await db.query('BEGIN');
  try {
    const event = await append(db, {
      scope: args.scope,
      proposalId: id,
      type: 'approval.proposed',
      at,
      actorKind: args.actorKind ?? 'agent',
      actorId: args.actorId,
      data: args.payload,
      contentHash,
    });
    await db.query(
      `INSERT INTO proposals (id, scope, kind, subject, status, proposed_at, proposed_by, content_hash)
       VALUES ($1, $2, $3, $4, 'proposed', $5, $6, $7)`,
      [id, args.scope, args.kind, args.subject, at, args.actorId, contentHash],
    );
    await db.query('COMMIT');
    return event;
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }
}

async function decide(
  db: Db,
  proposalId: string,
  human: Principal,
  type: 'approval.granted' | 'approval.rejected',
): Promise<StoredEvent> {
  const events = await eventsFor(db, proposalId);
  const current = project(events);
  if (!current) throw new ApprovalRefused(`no such proposal: ${proposalId}`);
  if (current.status !== 'proposed') {
    throw new ApprovalRefused(
      `proposal ${proposalId} is ${current.status}, not waiting for a decision. A decision that ` +
        'changed is a new proposal, not a second answer to an old one.',
    );
  }
  const contentHash = current.contentHash;
  if (type === 'approval.granted' && !contentHash) {
    throw new ApprovalRefused(
      'refusing to grant a proposal with no content hash: there would be nothing stopping the ' +
        'payload changing between the yes and the doing.',
    );
  }

  const at = new Date().toISOString();
  await db.query('BEGIN');
  try {
    const event = await append(db, {
      scope: current.scope,
      proposalId,
      type,
      at,
      // ONLY A HUMAN. The signature of this function takes a `Principal`, which is a signed-in
      // person, so there is no way to call it as an agent - the type is the gate, not a check that
      // could be forgotten.
      actorKind: 'human',
      actorId: human.email,
      data:
        type === 'approval.granted'
          ? { grant: signGrant(proposalId, contentHash as string, human.email, secret()) }
          : {},
      contentHash: contentHash ?? null,
    });
    await db.query(
      `UPDATE proposals SET status = $2, decided_at = $3, decided_by = $4 WHERE id = $1`,
      [proposalId, type === 'approval.granted' ? 'granted' : 'rejected', at, human.email],
    );
    await db.query('COMMIT');
    return event;
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }
}

/** A person says yes. */
export const grant = (db: Db, proposalId: string, human: Principal) =>
  decide(db, proposalId, human, 'approval.granted');

/** A person says no. */
export const reject = (db: Db, proposalId: string, human: Principal) =>
  decide(db, proposalId, human, 'approval.rejected');

/**
 * Do the thing. THE ONLY PLACE AN EXTERNAL ACTION HAPPENS.
 *
 * Four refusals before anything leaves the building, and each of them writes NOTHING:
 *
 *   1. the proposal is not granted;
 *   2. there is no granted event whose own attestation verifies;
 *   3. the grant's separate attestation does not verify for this proposal, hash and person;
 *   4. the payload's hash no longer matches what the grant approved.
 *
 * Only then does it record `action.executing`, run the registered executor, and record `executed`
 * or `failed`. A failure is recorded, not swallowed: a gate that goes quiet on failure is one
 * nobody can tell from a gate that never fired.
 */
export async function execute(
  db: Db,
  proposalId: string,
  executorId: string,
  registry: ExecutorRegistry,
): Promise<{ status: 'executed' | 'failed'; result: Record<string, unknown> }> {
  const events = await eventsFor(db, proposalId);
  const current = project(events);
  if (!current) throw new ApprovalRefused(`no such proposal: ${proposalId}`);

  if (current.status !== 'granted') {
    throw new ApprovalRefused(
      `refusing to execute ${proposalId}: it is ${current.status}, not granted. Nothing external ` +
        'happens without a person saying yes.',
    );
  }

  const s = secret();
  const granted = events
    .filter((e) => e.type === 'approval.granted' && verify(toSignable(e), e.attestation, s))
    .sort((a, b) => b.seq - a.seq)[0];
  if (!granted) {
    throw new ApprovalRefused(
      `refusing to execute ${proposalId}: no granted event with a verifying attestation. An event ` +
        'anybody with database access could have written is not a grant.',
    );
  }

  const grantAttestation =
    typeof granted.data.grant === 'string' ? (granted.data.grant as string) : null;
  if (
    !granted.contentHash ||
    !verifyGrant(proposalId, granted.contentHash, granted.actorId, grantAttestation, s)
  ) {
    throw new ApprovalRefused(
      `refusing to execute ${proposalId}: the grant's own attestation does not verify. The event ` +
        'says a person approved this; the grant signature is what makes that checkable.',
    );
  }

  // THE PAYLOAD MUST STILL BE THE ONE THAT WAS APPROVED. Recomputed from the log rather than read
  // from the projection, so a tampered `proposals` row cannot get an execution past this.
  //
  // MORE THAN ONE PROPOSAL EVENT IS ITSELF A REFUSAL. The log is append-only, so nobody can EDIT a
  // payload - but append-only does not stop an INSERT, and appending a second `approval.proposed`
  // with a larger amount after the grant is the shape the attack actually takes. A proposal is
  // proposed once; two is either tampering or a bug, and neither should reach the outside world.
  const proposals = events.filter((e) => e.type === 'approval.proposed');
  if (proposals.length !== 1) {
    throw new ApprovalRefused(
      `refusing to execute ${proposalId}: its log holds ${proposals.length} proposal events and a ` +
        'proposal is proposed once. Two is either tampering or a bug; neither goes out.',
    );
  }
  const proposed = proposals[0];
  if (contentHashOf(proposed.data) !== granted.contentHash) {
    throw new ApprovalRefused(
      `refusing to execute ${proposalId}: the payload does not match what was approved. This is ` +
        'the difference between approving a payment and approving an amount.',
    );
  }

  const executor = registry[await kindOf(db, proposalId)];
  if (!executor) {
    throw new ApprovalRefused(
      `refusing to execute ${proposalId}: no executor is registered for its kind. A proposal whose ` +
        'action nobody implemented must not silently report success.',
    );
  }

  const scope = current.scope;
  await append(db, {
    scope,
    proposalId,
    type: 'action.executing',
    at: new Date().toISOString(),
    actorKind: 'executor',
    actorId: executorId,
    data: {},
    contentHash: granted.contentHash,
  });
  await db.query("UPDATE proposals SET status = 'executing' WHERE id = $1", [proposalId]);

  try {
    const result = await executor(proposed.data);
    const at = new Date().toISOString();
    await append(db, {
      scope,
      proposalId,
      type: 'action.executed',
      at,
      actorKind: 'executor',
      actorId: executorId,
      data: result,
      contentHash: granted.contentHash,
    });
    await db.query("UPDATE proposals SET status = 'executed', executed_at = $2 WHERE id = $1", [
      proposalId,
      at,
    ]);
    return { status: 'executed', result };
  } catch (err) {
    // RECORDED, NOT SWALLOWED. A gate that goes quiet on failure cannot be told from one that
    // never fired, and the difference matters when somebody asks whether the invoice went out.
    const message = err instanceof Error ? err.message : String(err);
    await append(db, {
      scope,
      proposalId,
      type: 'action.failed',
      at: new Date().toISOString(),
      actorKind: 'executor',
      actorId: executorId,
      data: { error: message },
      contentHash: granted.contentHash,
    });
    await db.query("UPDATE proposals SET status = 'failed' WHERE id = $1", [proposalId]);
    return { status: 'failed', result: { error: message } };
  }
}

async function kindOf(db: Db, proposalId: string): Promise<string> {
  const { rows } = await db.query('SELECT kind FROM proposals WHERE id = $1', [proposalId]);
  return rows[0] ? String(rows[0].kind) : '';
}

/**
 * One event, as a sentence somebody who does not read code can follow.
 *
 * CLAUDE.md #12. The trail is shown to the Executive Management team, and a row reading
 * `action.executed` tells them nothing about what happened.
 */
export function narrate(e: StoredEvent): string {
  const when = new Date(e.at).toISOString().slice(0, 16).replace('T', ' ');
  switch (e.type) {
    case 'approval.proposed':
      return `${when} — ${e.actorId} proposed this, and it is waiting for a person.`;
    case 'approval.granted':
      return `${when} — ${e.actorId} approved it.`;
    case 'approval.rejected':
      return `${when} — ${e.actorId} refused it. Nothing was sent.`;
    case 'action.executing':
      return `${when} — carrying it out.`;
    case 'action.executed':
      return `${when} — done.`;
    case 'action.failed':
      return `${when} — it failed: ${String(e.data.error ?? 'no reason recorded')}.`;
  }
}

export { contentHashOf, verify } from './signing';
