/**
 * The health check Railway watches (`railway.json` points at this path).
 *
 * Deliberately dumb and deliberately public. It answers "is this process serving HTTP", which is
 * the only question a platform health check should ask. It does NOT touch the database, call a
 * studio, or read a credential: a health check that depends on something else turns that thing's
 * outage into this service being killed and restarted, repeatedly, which is how a small failure
 * becomes a total one.
 *
 * HC-007 adds the deployed commit and the migration head to the body, once there is a build to name
 * and a migration to have a head.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ status: 'ok', service: 'holy-corner' });
}
