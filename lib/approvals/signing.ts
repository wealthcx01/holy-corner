import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Signing and verifying an approval event.
 *
 * The gate's whole value is that the record cannot be forged. Anybody with write access to the
 * database can append a row saying a person approved something; the attestation is what makes that
 * row detectable as a fake, because producing a valid one needs the secret and the secret is not in
 * the database.
 *
 * Ported in spirit from fountainbridge `lib/activegraph-log.ts` (FB-051), including the two rules
 * that file learned the hard way and states in its own header.
 */

/** The canonical form. A FIXED FIELD ORDER, so the same event always hashes to the same string. */
export interface Signable {
  readonly v: number;
  readonly seq: number;
  readonly scope: string;
  readonly proposalId: string;
  readonly type: string;
  readonly at: string;
  readonly actorKind: string;
  readonly actorId: string;
  readonly data: unknown;
  readonly contentHash: string | null;
}

/**
 * Serialise an event to the one string that gets signed.
 *
 * FIXED ORDER, NOT `JSON.stringify(event)`. Object key order is an implementation detail in
 * JavaScript and a property of the driver in Postgres: a `jsonb` column returns its keys in an
 * order that is not the one they went in. An attestation computed over an incidental ordering
 * verifies on the machine that wrote it and fails everywhere else, which presents as "the audit log
 * is corrupt" rather than as a serialisation bug.
 *
 * `data` is canonicalised recursively for the same reason.
 */
export function canonicalEvent(e: Signable): string {
  return JSON.stringify([
    e.v,
    e.seq,
    e.scope,
    e.proposalId,
    e.type,
    e.at,
    e.actorKind,
    e.actorId,
    canonicalValue(e.data),
    e.contentHash ?? null,
  ]);
}

/** Sort object keys at every depth, so two equal payloads always serialise identically. */
export function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((k) => [k, canonicalValue((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

/**
 * The hash of a proposal's payload. What a grant binds itself to.
 *
 * A plain digest, not an HMAC: this is an identity, not a claim. It answers "is this the same
 * payload" and nothing else, and it has to be reproducible by anybody holding the payload,
 * including a reviewer checking the trail by hand.
 */
export function contentHashOf(payload: unknown): string {
  const canonical = JSON.stringify(canonicalValue(payload));
  return `sha256:${createHmac('sha256', 'holy-corner.content-hash').update(canonical).digest('hex')}`;
}

export function sign(event: Signable, secret: string): string {
  if (!secret) {
    throw new Error(
      'HC_APPROVAL_SECRET is not set. The approval log will not sign an event without it, because ' +
        'an unsigned event is one anybody with database access could have written.',
    );
  }
  return createHmac('sha256', secret).update(canonicalEvent(event)).digest('hex');
}

/**
 * Does this event's attestation verify?
 *
 * TIMING SAFE, and false for anything malformed rather than throwing. A verification that throws on
 * a bad input is one a caller wraps in a try/catch that swallows a real failure alongside a
 * malformed one.
 */
export function verify(event: Signable, attestation: string | null, secret: string): boolean {
  if (!attestation || !secret) return false;
  let expected: string;
  try {
    expected = sign(event, secret);
  } catch {
    return false;
  }
  const a = Buffer.from(attestation, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  // `timingSafeEqual` throws on a length mismatch, which would itself leak the length. Compare
  // lengths first and return the same false either way.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * The grant attestation is a SEPARATE FORMULA from the event attestation.
 *
 * Fountainbridge's header says this in as many words: two HMAC formulas, one for a grant and one
 * for an event, and do not merge them. If they were the same, an event of one type could be
 * replayed as a grant, because the signature would still verify over a string that no longer says
 * what it used to.
 *
 * Domain-separated by a prefix that is itself part of what gets signed.
 */
export function signGrant(
  proposalId: string,
  contentHash: string,
  humanId: string,
  secret: string,
): string {
  if (!secret) throw new Error('HC_APPROVAL_SECRET is not set; refusing to sign a grant.');
  return createHmac('sha256', secret)
    .update(`grant ${proposalId} ${contentHash} ${humanId}`)
    .digest('hex');
}

export function verifyGrant(
  proposalId: string,
  contentHash: string,
  humanId: string,
  attestation: string | null,
  secret: string,
): boolean {
  if (!attestation || !secret) return false;
  let expected: string;
  try {
    expected = signGrant(proposalId, contentHash, humanId, secret);
  } catch {
    return false;
  }
  const a = Buffer.from(attestation, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
