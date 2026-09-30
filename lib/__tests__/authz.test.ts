import { describe, expect, it } from 'vitest';
import {
  PILLARS, ScopeViolation, assertPillar, inMemoryRoles, parseEmailList, requireRole,
  resolvePrincipal, scopeViolationToResponse, type Resolution,
} from '../authz';

const ADMINS = ['john@bruntsfield.capital', 'john.gallagher@wealthcx.com'];
const DOMAIN = 'bruntsfield.capital';

const roles = inMemoryRoles({
  'exec@bruntsfield.capital': { role: 'exec' },
  'finance@bruntsfield.capital': { role: 'finance' },
  'analyst@bruntsfield.capital': { role: 'staff', pillars: ['advisory'] },
  'openstaff@bruntsfield.capital': { role: 'staff' },
});

const resolve = (email: string | null | undefined): Resolution =>
  resolvePrincipal(email, { adminEmails: ADMINS, roles, workspaceDomain: DOMAIN });

describe('who gets in, and as what', () => {
  it('lets John in as admin on EITHER of his addresses', () => {
    // His second address is not on the Workspace domain, and must still work. Fountainbridge
    // carries both for the same reason.
    for (const email of ADMINS) {
      const r = resolve(email);
      expect(r.kind, email).toBe('principal');
      if (r.kind !== 'principal') throw new Error('unreachable');
      expect(r.principal.role).toBe('admin');
      expect(r.principal.pillars).toEqual(PILLARS);
      expect(r.principal.sub).toBe(email);
    }
  });

  it('is not fooled by casing or stray whitespace in the address', () => {
    const r = resolve('  John@Bruntsfield.Capital  ');
    expect(r.kind).toBe('principal');
    if (r.kind !== 'principal') throw new Error('unreachable');
    expect(r.principal.email).toBe('john@bruntsfield.capital');
  });

  it('resolves each role from the role source', () => {
    for (const [email, role] of [
      ['exec@bruntsfield.capital', 'exec'],
      ['finance@bruntsfield.capital', 'finance'],
      ['analyst@bruntsfield.capital', 'staff'],
    ] as const) {
      const r = resolve(email);
      expect(r.kind, email).toBe('principal');
      if (r.kind !== 'principal') throw new Error('unreachable');
      expect(r.principal.role).toBe(role);
    }
  });

  it('gives a staff principal only the pillars named for them', () => {
    const r = resolve('analyst@bruntsfield.capital');
    if (r.kind !== 'principal') throw new Error('unreachable');
    expect(r.principal.pillars).toEqual(['advisory']);
  });

  it('gives a staff principal with no pillars named NOTHING, not everything', () => {
    // The safe reading of an unset scope is the empty one. The other reading hands a new staff
    // account the whole group because somebody left a column blank.
    const r = resolve('openstaff@bruntsfield.capital');
    if (r.kind !== 'principal') throw new Error('unreachable');
    expect(r.principal.pillars).toEqual([]);
  });

  it('gives exec and finance every pillar, because the plan calls them cross-pillar', () => {
    for (const email of ['exec@bruntsfield.capital', 'finance@bruntsfield.capital']) {
      const r = resolve(email);
      if (r.kind !== 'principal') throw new Error('unreachable');
      expect(r.principal.pillars, email).toEqual(PILLARS);
    }
  });
});

describe('who does not get in', () => {
  it('refuses a personal Google account', () => {
    // CLAUDE.md #8: never a personal @gmail.com.
    const r = resolve('john.gallagher@gmail.com');
    expect(r).toEqual({ kind: 'refused', reason: 'wrong-domain' });
  });

  it('refuses an address that merely CONTAINS the Workspace domain', () => {
    // The attack the endsWith check exists for. A substring match would let this straight in.
    for (const email of [
      'attacker@bruntsfield.capital.example.com',
      'attacker@notbruntsfield.capital.co',
      'bruntsfield.capital@gmail.com',
    ]) {
      expect(resolve(email), email).toEqual({ kind: 'refused', reason: 'wrong-domain' });
    }
  });

  it('refuses an empty, blank or malformed identity without consulting any list', () => {
    for (const email of [null, undefined, '', '   ', 'not-an-email']) {
      expect(resolve(email as string | null | undefined), String(email))
        .toEqual({ kind: 'refused', reason: 'not-signed-in' });
    }
  });

  it('cannot be let in by a blank entry in a badly formatted admin list', () => {
    // `HC_ADMIN_EMAILS=" ,,john@bruntsfield.capital, "` must not make "" an admin.
    const r = resolvePrincipal('', {
      adminEmails: parseEmailList(' ,,john@bruntsfield.capital, '),
      roles,
      workspaceDomain: DOMAIN,
    });
    expect(r).toEqual({ kind: 'refused', reason: 'not-signed-in' });
  });
});

describe('signed in, but nobody has given them a role', () => {
  it('is its own outcome, not a refusal', () => {
    // A new colleague's first sign-in. Telling them their account is broken would be wrong.
    const r = resolve('newcolleague@bruntsfield.capital');
    expect(r).toEqual({ kind: 'no-role', email: 'newcolleague@bruntsfield.capital' });
  });

  it('never gets a default role', () => {
    // grassmarket ADR-0044: auto-provisioning creates the LOWEST role and never a configurable
    // one. Here it creates no role at all until a person assigns one.
    const r = resolve('newcolleague@bruntsfield.capital');
    expect(r.kind).not.toBe('principal');
  });
});

describe('an allowlist cannot punch through the domain boundary', () => {
  it('exempts an allowlisted admin from the domain check, and from nothing else', () => {
    const r = resolve('john.gallagher@wealthcx.com');
    expect(r.kind).toBe('principal');
  });

  it('still refuses an off-domain address that is not allowlisted', () => {
    expect(resolve('someone@wealthcx.com')).toEqual({ kind: 'refused', reason: 'wrong-domain' });
  });

  it('lets any signed-in identity through when no domain is configured', () => {
    // Local development with HC_WORKSPACE_DOMAIN unset must still work, and must still have no
    // role. Absence of a boundary is not presence of a grant.
    const r = resolvePrincipal('someone@example.com', { adminEmails: [], roles });
    expect(r).toEqual({ kind: 'no-role', email: 'someone@example.com' });
  });
});

describe('a request for something out of scope is a 404, never a 403', () => {
  const staff = (() => {
    const r = resolve('analyst@bruntsfield.capital');
    if (r.kind !== 'principal') throw new Error('unreachable');
    return r.principal;
  })();

  it('throws for a pillar this principal does not hold', () => {
    expect(() => assertPillar(staff, 'foundry')).toThrow(ScopeViolation);
    expect(() => assertPillar(staff, 'advisory')).not.toThrow();
  });

  it('lets an admin through every pillar', () => {
    const r = resolve('john@bruntsfield.capital');
    if (r.kind !== 'principal') throw new Error('unreachable');
    for (const p of PILLARS) expect(() => assertPillar(r.principal, p)).not.toThrow();
  });

  it('throws for a role this principal does not hold', () => {
    expect(() => requireRole(staff, 'admin', 'finance')).toThrow(ScopeViolation);
    expect(() => requireRole(staff, 'staff')).not.toThrow();
  });

  it('renders as 404 with a body that confirms nothing', async () => {
    const res = scopeViolationToResponse(new ScopeViolation());
    expect(res).not.toBeNull();
    expect(res!.status).toBe(404);
    // Not 403, and the body must not say "forbidden", "denied", or name the thing asked for. A 403
    // on /record/organisations/openbb would confirm OpenBB is a counterparty of ours.
    expect(await res!.json()).toEqual({ detail: 'Not found.' });
  });

  it('does not swallow an unrelated error', () => {
    // A bug must not be dressed up as "not found" — that is how a real fault stays hidden.
    expect(scopeViolationToResponse(new TypeError('a real bug'))).toBeNull();
  });
});
