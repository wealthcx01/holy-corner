import 'server-only';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { navFor } from './nav';
import {
  inMemoryRoles, parseEmailList, resolvePrincipal,
  type Principal, type Resolution, type RoleAssignment,
} from './authz';

/**
 * The one place a server component asks "who is this, and what may they see".
 *
 * `server-only` at the top is load-bearing: it makes importing this from a client component a
 * BUILD ERROR rather than a runtime surprise, and this module reads the environment.
 */

/**
 * Role assignments, until HC-004 has a table.
 *
 * `HC_ROLE_ASSIGNMENTS` is deliberately NOT in `.env.example` as a production variable and is not
 * documented as a way to run the product. It exists so the four roles can be exercised locally and
 * by HC-006's UI gate before there is a database. HC-004 replaces this function body with a query
 * and deletes the variable; nothing else in the codebase changes, because everything downstream
 * takes a `RoleSource`.
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

/** Resolve the signed-in person. Returns the full three-way outcome, never a bare principal. */
export async function currentResolution(): Promise<Resolution> {
  const session = await auth();
  return resolvePrincipal(session?.user?.email, {
    adminEmails: parseEmailList(process.env.HC_ADMIN_EMAILS),
    roles: roleSourceFromEnv(),
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
