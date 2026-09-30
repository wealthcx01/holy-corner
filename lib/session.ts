import 'server-only';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { navFor } from './nav';
import {
  inMemoryRoles, parseEmailList, resolvePrincipal,
  type Principal, type Resolution, type RoleAssignment, type RoleSource,
} from './authz';

/**
 * The one place a server component asks "who is this, and what may they see".
 *
 * `server-only` at the top is load-bearing: it makes importing this from a client component a
 * BUILD ERROR rather than a runtime surprise, and this module reads the environment.
 */

/**
 * Role assignments from the environment.
 *
 * HC-004 has the `people` table now, and `currentResolution` reads it FIRST. This remains for two
 * cases that are not the database, and is documented in `.env.example` as neither production nor a
 * way to run the product:
 *
 *   - local development and HC-006's UI gate, which drive the four roles without standing up
 *     Postgres to do it;
 *   - the window before somebody is IN the record. HC-003's rule is that a Bruntsfield identity
 *     nobody has given a role to sees `/not-authorized`, and that is still what happens: this
 *     variable is empty on a real deployment, so the environment grants nothing.
 *
 * Format: `email=role[:pillar|pillar]` entries, comma or whitespace separated.
 */
function roleSourceFromEnv() {
  const raw = process.env.HC_ROLE_ASSIGNMENTS;
  const entries: Record<string, RoleAssignment> = {};
  if (raw) {
    for (const entry of raw.split(/[,\s]+/).filter(Boolean)) {
      const eq = entry.indexOf('=');
      if (eq <= 0) continue;
      const email = entry.slice(0, eq).trim().toLowerCase();
      const [role, pillarsRaw] = entry.slice(eq + 1).split(':');
      if (!email.includes('@') || !role) continue;
      entries[email] = {
        role: role.trim() as RoleAssignment['role'],
        pillars: pillarsRaw
          ? (pillarsRaw.split('|').map((p) => p.trim()).filter(Boolean) as RoleAssignment['pillars'])
          : undefined,
      };
    }
  }
  return inMemoryRoles(entries);
}

/**
 * The role source for ONE request.
 *
 * Reads the record for this one address and hands `resolvePrincipal` a source holding at most one
 * entry. That is why `RoleSource` is synchronous: the lookup happens here, once, with the address
 * already known, rather than being an awaitable call that a caller can forget to await (a forgotten
 * await returns a Promise, and `if (promise)` is always true).
 *
 * The database wins where it has an answer. The environment is the fallback, so a deployment with
 * no `HC_ROLE_ASSIGNMENTS` set grants exactly what the record says and nothing else.
 *
 * NEVER FATAL. If the database is unreachable this falls back rather than throwing, because a
 * failed lookup must not become "everybody is signed out": it resolves to no role, which is
 * `/not-authorized`, which says what is wrong. Refusing safely beats failing loudly on the one
 * path that decides whether anybody can use the product at all.
 */
async function roleSourceFor(email: string | null | undefined): Promise<RoleSource> {
  const env = roleSourceFromEnv();
  if (!email || !process.env.DATABASE_URL) return env;
  try {
    const { Repository } = await import('./data/repository');
    const { db } = await import('./db');
    const person = await new Repository(db()).findByEmail(email);
    if (!person) return env;
    return inMemoryRoles({ [person.email]: { role: person.role, pillars: person.pillars } });
  } catch {
    return env;
  }
}

/** Resolve the signed-in person. Returns the full three-way outcome, never a bare principal. */
export async function currentResolution(): Promise<Resolution> {
  const session = await auth();
  const email = session?.user?.email;
  return resolvePrincipal(email, {
    adminEmails: parseEmailList(process.env.HC_ADMIN_EMAILS),
    roles: await roleSourceFor(email),
    workspaceDomain: process.env.HC_WORKSPACE_DOMAIN,
  });
}

/** The principal, or null when there is not one. Callers must handle the null. */
export async function currentPrincipal(): Promise<Principal | null> {
  const r = await currentResolution();
  return r.kind === 'principal' ? r.principal : null;
}

/**
 * The gate for one section. Call it at the top of every page under `app/(signed-in)/`.
 *
 * ## Why it asks `navFor` rather than having rules of its own
 *
 * `lib/nav.ts` already decides which sections each role may see, and the top bar renders from it.
 * If this function carried its own copy of those rules, the two would drift, and the direction they
 * drift in is the dangerous one: the nav stops offering a link long before anybody notices the
 * server still serves it. Asking the same function means the link a role is offered and the page a
 * role may open are THE SAME DECISION, computed once.
 *
 * ## Why 404 and not 403
 *
 * `notFound()`, always. A 403 on `/money` tells whoever asked that there is a Money section with
 * something in it. Grassmarket's `ScopeViolationError` makes the same choice, and HC-003 asks for
 * it by name: "404, never 403, never a body that confirms existence".
 *
 * ## What this is NOT
 *
 * It is not the last line of defence and must never be treated as one. It gates a SECTION. Once
 * HC-004 exists, `assertPillar` and `requireRole` inside the repository gate the individual RECORD,
 * before a row is read, so a route that forgets to call this still cannot read another pillar's
 * data (CLAUDE.md #8).
 */
export async function requireSection(href: string): Promise<Principal> {
  const principal = await currentPrincipal();
  // No principal at all is the signed-in layout's job, and it redirects before a page renders.
  // Reaching here without one means that layout was bypassed, which is a 404 rather than a crash.
  if (!principal) notFound();
  if (!navFor(principal.role).some((e) => e.href === href)) notFound();
  return principal;
}
