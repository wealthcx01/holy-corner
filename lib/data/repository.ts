import 'server-only';
import type { Db } from '@/lib/db/driver';
import { ScopeViolation, type Pillar, type Principal, type Role } from '@/lib/authz';

/**
 * THE ONLY PLACE SQL LIVES.
 *
 * Plan D3 and CLAUDE.md #8. Grassmarket learned this the expensive way and says so: one repository,
 * every method taking a principal first, scoping applied BEFORE anything is read, and a scope
 * violation that becomes a 404 rather than a 403. Feature code never issues a query.
 *
 * ## Why the principal is the first argument of every method
 *
 * Not a field on the class, not something read from a request context, not optional. Making it the
 * first parameter means a method that forgets to scope is a method somebody wrote while looking
 * straight at the principal they did not use, and it means every call site has to say whose request
 * this is. HC-003 learned what happens when the decision is computed somewhere and acted on
 * nowhere: a nav that hid four links over a server that served all five.
 *
 * ## Why scoping happens HERE and not only in the routes
 *
 * HC-003's `requireSection` gates a SECTION, in the page. This gates a ROW, before it is read. A
 * route that forgets the first still cannot get past the second. Two independent gates, and the
 * inner one is the one that holds when somebody adds a route in a hurry.
 */
export class Repository {
  constructor(private readonly db: Db) {}

  // --- the guards, used by every read below ---------------------------------------------------

  /** Throws unless the principal holds one of these roles. */
  private requireRole(principal: Principal, ...allowed: readonly Role[]): void {
    if (!allowed.includes(principal.role)) throw new ScopeViolation();
  }

  /** Throws unless the principal may see this pillar. Admin sees every pillar. */
  private requirePillar(principal: Principal, pillar: Pillar): void {
    if (principal.role === 'admin') return;
    if (!principal.pillars.includes(pillar)) throw new ScopeViolation();
  }

  // --- people ---------------------------------------------------------------------------------

  /**
   * Everybody, for the role-assignment screen.
   *
   * Admin only. A staff account listing the group's people is a directory nobody asked for, and
   * grassmarket makes the same call for the same reason: its scoping discipline is that advisors
   * do not see each other.
   */
  async listPeople(principal: Principal): Promise<PersonRow[]> {
    this.requireRole(principal, 'admin');
    const { rows } = await this.db.query(
      'SELECT id, email, display_name, role, pillars, identities, created_at FROM people ORDER BY display_name',
    );
    return rows.map(toPerson);
  }

  /**
   * One person.
   *
   * Anybody may read THEMSELVES; only an admin may read somebody else. The check is on the resolved
   * row's identities rather than on the id passed in, so asking for another person's id by guessing
   * gets the same `ScopeViolation` as asking for it by name.
   */
  async getPerson(principal: Principal, id: string): Promise<PersonRow | null> {
    const { rows } = await this.db.query(
      'SELECT id, email, display_name, role, pillars, identities, created_at FROM people WHERE id = $1',
      [id],
    );
    const row = rows[0];
    // A row that does not exist and a row this principal may not see are THE SAME ANSWER. Anything
    // else is an existence oracle: ask for ids until one of them answers differently.
    if (!row) return null;
    const person = toPerson(row);
    if (principal.role !== 'admin' && !isSelf(principal, person)) throw new ScopeViolation();
    return person;
  }

  /** The person this principal is, if the record knows them yet. */
  async findByEmail(email: string): Promise<PersonRow | null> {
    const needle = email.trim().toLowerCase();
    const { rows } = await this.db.query(
      `SELECT id, email, display_name, role, pillars, identities, created_at
         FROM people
        WHERE email = $1 OR $1 = ANY (identities)`,
      [needle],
    );
    return rows[0] ? toPerson(rows[0]) : null;
  }

  /**
   * Change somebody's role, as an APPEND to the history and a projection onto `people`.
   *
   * Both writes in one transaction, because a projection that disagrees with its history is worse
   * than either alone: the application reads one and the audit reads the other.
   */
  async assignRole(
    principal: Principal,
    personId: string,
    role: Role,
    pillars: readonly Pillar[],
    reason?: string,
  ): Promise<void> {
    this.requireRole(principal, 'admin');
    await this.db.query('BEGIN');
    try {
      await this.db.query(
        'INSERT INTO role_assignments (person_id, role, pillars, assigned_by, reason) VALUES ($1, $2, $3, $4, $5)',
        [personId, role, pillars as unknown as string[], principal.email, reason ?? null],
      );
      await this.db.query('UPDATE people SET role = $2, pillars = $3 WHERE id = $1', [
        personId, role, pillars as unknown as string[],
      ]);
      await this.db.query(
        `INSERT INTO activity_log (actor, action, entity_type, entity_id, details)
         VALUES ($1, 'role.assigned', 'person', $2, $3::jsonb)`,
        [principal.email, personId, JSON.stringify({ role, pillars, reason: reason ?? null })],
      );
      await this.db.query('COMMIT');
    } catch (err) {
      await this.db.query('ROLLBACK');
      throw err;
    }
  }

  /** Every role this person has ever held, newest first. Admin only: it is the audit trail. */
  async roleHistory(principal: Principal, personId: string): Promise<RoleAssignmentRow[]> {
    this.requireRole(principal, 'admin');
    const { rows } = await this.db.query(
      `SELECT id, person_id, role, pillars, assigned_by, reason, assigned_at
         FROM role_assignments WHERE person_id = $1 ORDER BY assigned_at DESC, id DESC`,
      [personId],
    );
    return rows.map((r) => ({
      id: Number(r.id),
      personId: String(r.person_id),
      role: String(r.role) as Role,
      pillars: (r.pillars as string[]) as Pillar[],
      assignedBy: String(r.assigned_by),
      reason: r.reason === null ? null : String(r.reason),
      assignedAt: new Date(r.assigned_at as string),
    }));
  }

  // --- activity -------------------------------------------------------------------------------

  async record(
    principal: Principal,
    action: string,
    entityType: string,
    entityId: string,
    details: Record<string, unknown> = {},
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO activity_log (actor, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [principal.email, action, entityType, entityId, JSON.stringify(details)],
    );
  }

  /**
   * What happened, newest first.
   *
   * `exec` and above see the group's activity; `finance` sees it too, because every money action is
   * in here. `staff` sees only what they did themselves, which is the same rule as `getPerson`.
   */
  async recentActivity(principal: Principal, limit = 50): Promise<ActivityRow[]> {
    const capped = Math.min(Math.max(1, Math.trunc(limit)), 500);
    const scoped = principal.role === 'staff';
    const { rows } = await this.db.query(
      `SELECT id, actor, action, entity_type, entity_id, at, details
         FROM activity_log
        ${scoped ? 'WHERE actor = $2' : ''}
        ORDER BY at DESC, id DESC
        LIMIT $1`,
      scoped ? [capped, principal.email] : [capped],
    );
    return rows.map((r) => ({
      id: Number(r.id),
      actor: String(r.actor),
      action: String(r.action),
      entityType: String(r.entity_type),
      entityId: String(r.entity_id),
      at: new Date(r.at as string),
      details: (r.details ?? {}) as Record<string, unknown>,
    }));
  }

  /** Reserved for Phase 1, and here so the pillar guard has a caller and a test from day one. */
  async assertMaySeePillar(principal: Principal, pillar: Pillar): Promise<void> {
    this.requirePillar(principal, pillar);
  }
}

export interface PersonRow {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  pillars: Pillar[];
  identities: string[];
  createdAt: Date;
}

export interface RoleAssignmentRow {
  id: number;
  personId: string;
  role: Role;
  pillars: Pillar[];
  assignedBy: string;
  reason: string | null;
  assignedAt: Date;
}

export interface ActivityRow {
  id: number;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  at: Date;
  details: Record<string, unknown>;
}

function toPerson(r: Record<string, unknown>): PersonRow {
  return {
    id: String(r.id),
    email: String(r.email),
    displayName: String(r.display_name),
    role: String(r.role) as Role,
    pillars: (r.pillars as string[]) as Pillar[],
    identities: (r.identities as string[]) ?? [],
    createdAt: new Date(r.created_at as string),
  };
}

/** Is this row the principal themselves, by any of the addresses that are this same person? */
function isSelf(principal: Principal, person: PersonRow): boolean {
  const mine = principal.email.toLowerCase();
  return person.email.toLowerCase() === mine || person.identities.some((i) => i.toLowerCase() === mine);
}
