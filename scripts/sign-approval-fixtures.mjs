#!/usr/bin/env node
/**
 * Re-sign the approval fixtures (HC-042).
 *
 *   HC_APPROVAL_SECRET=... node scripts/sign-approval-fixtures.mjs <file.json>
 *
 * A fixture that means "granted" has to be SIGNED LIKE THE REAL THING, because an unsigned event
 * does not verify and a proposal holding one reads `unverified` rather than `granted`. That is the
 * gate working correctly, and it is also why an unsigned fixture makes a test fail for a reason
 * that has nothing to do with what the test is about.
 *
 * Fountainbridge hit exactly this (FB-051) and wrote the same script for the same reason.
 *
 * Run it after adding or renaming a fixture. It rewrites the `attestation` on every event in the
 * file, in place.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';

const secret = process.env.HC_APPROVAL_SECRET;
if (!secret) {
  console.error('HC_APPROVAL_SECRET is not set. Refusing to sign anything without it.');
  process.exit(2);
}

const file = process.argv[2];
if (!file) {
  console.error('usage: HC_APPROVAL_SECRET=... node scripts/sign-approval-fixtures.mjs <file.json>');
  process.exit(2);
}

// The same canonical form lib/approvals/signing.ts uses. Kept in step by a test that signs a
// fixture with this script and verifies it with the library, so the two cannot drift apart
// silently — which is the failure fountainbridge's own mint script has a test for.
const canonicalValue = (v) =>
  Array.isArray(v)
    ? v.map(canonicalValue)
    : v && typeof v === 'object'
      ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonicalValue(v[k])]))
      : v;

const canonicalEvent = (e) =>
  JSON.stringify([
    e.v ?? 1,
    e.seq,
    e.scope,
    e.proposalId,
    e.type,
    e.at,
    e.actorKind,
    e.actorId,
    canonicalValue(e.data ?? {}),
    e.contentHash ?? null,
  ]);

const events = JSON.parse(readFileSync(file, 'utf8'));
if (!Array.isArray(events)) {
  console.error(`${file} must hold an array of events.`);
  process.exit(2);
}

for (const e of events) {
  e.attestation = createHmac('sha256', secret).update(canonicalEvent(e)).digest('hex');
}
writeFileSync(file, `${JSON.stringify(events, null, 2)}\n`);
console.log(`signed ${events.length} event(s) in ${file}`);
