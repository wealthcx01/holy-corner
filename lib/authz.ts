/**
 * Who is signed in, what role they hold, and what they may see.
 *
 * A PURE FUNCTION, called on every server request before a single row is fetched. CLAUDE.md #8:
 * scoping is server-side and role-based, enforced in the repository layer, tested explicitly from
 * day one. Nothing here reads a database, a header or a cookie, so every rule below can be tested
 * by calling it, which is the point.
 *
 * Three outcomes, not two, and the difference matters on a screen:
 *
 *   - `principal` - signed in, with a role. Gets on with their work.
 *   - `no-role`   - signed in on a Bruntsfield account nobody has given a role to yet. This is a
 *                   NORMAL state, not an error: a new colleague's first sign-in lands here. They
 *                   see `/not-authorized`, which explains what to do, and no data at all.
 *   - `refused`   - not a Bruntsfield identity. Never gets a session.
 *
 * Collapsing `no-role` into `refused` would tell a new colleague their account is broken. Giving
 * `no-role` a default role would hand data to somebody nobody has vouched for. Both are worse.
 */
import type { Role } from './nav';
export { ROLES, type Role } from './nav';

/** The Bruntsfield pillars a `staff` or pillar-scoped `exec` principal is confined to. */
export const PILLARS = ['advisory', 'foundry', 'clients', 'briefing', 'equity', 'cohort'] as const;
export type Pillar = (typeof PILLARS)[number];

/**
 * The signed-in person, as every downstream call sees them.
 *
 * `sub` is the stable identifier for this person. Today it is the normalised email, because that
 * is the only identifier that exists before HC-004 creates a people table. HC-035 turns this into
 * the "Holy Corner claim shape" that grassmarket already verifies (`sub, email, role, tier,
 * assessor_level, iss, aud`), so `sub` is a separate field from `email` FROM NOW rather than
 * discovered to be needed later.
 */
export interface Principal {
  readonly sub: string;
  readonly email: string;
  readonly role: Role;
  readonly pillars: readonly Pillar[];
}

/** What the role table holds for one person. HC-004 gives this a real table. */
export interface RoleAssignment {
  readonly role: Role;
  readonly pillars?: readonly Pillar[];
}

/**
 * Where role assignments come from.
 *
 * HC-004 backs this with the `role_assignments` table. Until then `inMemoryRoles()` implements the
 * same interface, so the switch is one line in one place and nothing else in the codebase learns
 * which it was. The interface is synchronous on purpose: a lookup that a caller can forget to await
 * is a lookup that silently returns a Promise, and `if (principal)` on a Promise is always true.
 * HC-004 resolves assignments once per request and passes them in, rather than making this async.
 */
export interface RoleSource {
  get(email: string): RoleAssignment | null;
}

export type Resolution =
  | { readonly kind: 'principal'; readonly principal: Principal }
  | { readonly kind: 'no-role'; readonly email: string }
  | { readonly kind: 'refused'; readonly reason: 'not-signed-in' | 'wrong-domain' };

const normalize = (email: string): string => email.trim().toLowerCase();

/** Parse a comma or whitespace separated env list (`HC_ADMIN_EMAILS`). */
export function parseEmailList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(/[,\s]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
}

/** A role source over a plain map. The stand-in until HC-004, behind the real interface. */
export function inMemoryRoles(entries: Record<string, RoleAssignment>): RoleSource {
  const map = new Map(Object.entries(entries).map(([e, a]) => [normalize(e), a]));
  return { get: (email) => map.get(normalize(email)) ?? null };
}

export interface ResolveOptions {
  /** `HC_ADMIN_EMAILS`. Both of John's addresses belong here (HC-003's context says so by name). */
  readonly adminEmails: readonly string[];
  readonly roles: RoleSource;
  /**
   * `HC_WORKSPACE_DOMAIN`, normally `bruntsfield.capital`.
   *
   * When it is set, an identity outside it is REFUSED even if some other list names it. That is
   * why the admin allowlist is checked after the domain, not before: an allowlist is a convenience
   * and a domain is a boundary, and a convenience must not be able to punch through a boundary.
   *
   * The exception is written down rather than assumed: John's second address,
   * `john.gallagher@wealthcx.com`, is not on the Workspace domain and must still work. So an
   * address on the admin allowlist is exempt from the domain check and ONLY from the domain check.
   * Fountainbridge carries both of his addresses for the same reason.
   */
  readonly workspaceDomain?: string;
}

/**
 * Resolve a signed-in email to a principal.
 *
 * Order matters and is deliberate:
 *   1. No email at all -> refused. An empty or whitespace-only identity must never fall through to
 *      a list comparison, where it could match a blank entry in a badly formatted env var.
 *   2. Not on the Workspace domain, and not an explicitly allowlisted admin -> refused.
 *   3. On the admin allowlist -> admin, every pillar.
 *   4. A role assignment -> that role.
 *   5. Otherwise -> no-role. Signed in, sees nothing, told why.
 */
export function resolvePrincipal(
  emailRaw: string | null | undefined,
  { adminEmails, roles, workspaceDomain }: ResolveOptions,
): Resolution {
  const email = typeof emailRaw === 'string' ? normalize(emailRaw) : '';
  if (!email || !email.includes('@')) return { kind: 'refused', reason: 'not-signed-in' };

  const admins = new Set(adminEmails.map((e) => e.trim().toLowerCase()).filter(Boolean));
  const isAdmin = admins.has(email);

  if (workspaceDomain) {
    const domain = workspaceDomain.trim().toLowerCase().replace(/^@/, '');
    // `endsWith('@' + domain)` and not `includes(domain)`: an address like
    // `attacker@bruntsfield.capital.example.com` contains the domain and is not on it.
    if (domain && !email.endsWith(`@${domain}`) && !isAdmin) {
      return { kind: 'refused', reason: 'wrong-domain' };
    }
  }

  if (isAdmin) {
    return {
      kind: 'principal',
      principal: { sub: email, email, role: 'admin', pillars: PILLARS },
    };
  }

  const assigned = roles.get(email);
  if (!assigned) return { kind: 'no-role', email };

  return {
    kind: 'principal',
    principal: {
      sub: email,
      email,
      role: assigned.role,
      // An exec with no pillars named sees every pillar; that is what "cross-pillar read" means in
      // the plan. A staff principal with no pillars named sees NONE, because the plan calls staff
      // "role-scoped" and the safe reading of an unset scope is the empty one.
      pillars: assigned.pillars ?? (assigned.role === 'exec' || assigned.role === 'finance' ? PILLARS : []),
    },
  };
}

/**
 * A request for something outside this principal's scope.
 *
 * ALWAYS RENDERED AS 404, NEVER 403, and never with a body that confirms the thing exists
 * (grassmarket's `ScopeViolationError` does the same). A 403 on `/record/organisations/openbb` tells
 * whoever asked that OpenBB is a counterparty of ours. That is a leak, and it leaks precisely the
 * commercial relationships HC-056 is about.
 */
export class ScopeViolation extends Error {
  constructor(message = 'Not found.') {
    super(message);
    this.name = 'ScopeViolation';
  }
}

/** Guard: may this principal see anything in this pillar? Throws, so a caller cannot ignore it. */
export function assertPillar(principal: Principal, pillar: Pillar): void {
  if (principal.role === 'admin') return;
  if (!principal.pillars.includes(pillar)) throw new ScopeViolation();
}

/** Guard: does this principal hold one of these roles? Throws, so a caller cannot ignore it. */
export function requireRole(principal: Principal, ...allowed: readonly Role[]): void {
  if (!allowed.includes(principal.role)) throw new ScopeViolation();
}

/** Turn any error into an HTTP response. A ScopeViolation is a 404 with nothing in it. */
export function scopeViolationToResponse(err: unknown): Response | null {
  if (err instanceof ScopeViolation) {
    return Response.json({ detail: 'Not found.' }, { status: 404 });
  }
  return null;
}
