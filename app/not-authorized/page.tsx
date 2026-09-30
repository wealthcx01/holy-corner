import { redirect } from 'next/navigation';
import { currentResolution } from '@/lib/session';

/**
 * Signed in, and nobody has given this account a role yet.
 *
 * THIS IS A NORMAL STATE, NOT AN ERROR, and the page is written that way. A new colleague's first
 * sign-in lands here. Telling them their account is broken, or showing a bare "403 Forbidden",
 * would be both unfriendly and untrue: the account is fine and the next step belongs to somebody
 * else. So the page says what happened, what it means, and what to do, in that order.
 */
export default async function NotAuthorized() {
  const resolution = await currentResolution();
  // Somebody who DOES have a role has no business here; send them to their work.
  if (resolution.kind === 'principal') redirect('/');

  // Two different people arrive here and they need to be told two different things. Giving both
  // the same words would tell a new colleague their account is wrong, or tell somebody using a
  // personal address that an administrator can fix it. Neither is true.
  const refusedForDomain = resolution.kind === 'refused' && resolution.reason === 'wrong-domain';

  if (refusedForDomain) {
    return (
      <div className="measure">
        <p className="eyebrow">Wrong account</p>
        <h1>That is not a Bruntsfield account</h1>
        <p>
          Holy Corner only accepts Bruntsfield accounts. It looks like you signed in with a personal
          one, which is easy to do when a browser is already signed in to something else.
        </p>
        <div className="callout callout-info">
          Sign out, then sign in again with your <strong>@bruntsfield.capital</strong> address.
        </div>
        <p className="muted">
          No administrator can change this for you. It is not a permission that is missing; it is a
          different account.
        </p>
      </div>
    );
  }

  const email = resolution.kind === 'no-role' ? resolution.email : null;

  return (
    <div className="measure">
      <p className="eyebrow">Signed in</p>
      <h1>You do not have a role yet</h1>
      {email ? (
        <p>
          You are signed in as <strong>{email}</strong>. That part worked.
        </p>
      ) : null}
      <p>
        Holy Corner shows the whole group&rsquo;s contracts, invoices and money, so nobody gets a
        default level of access. An administrator has to give your account a role before it can see
        anything, and until then this is the only page you can reach.
      </p>
      <div className="callout callout-info">
        Ask John to assign you a role. He needs to know which one: <strong>exec</strong> for
        cross-pillar reading, <strong>finance</strong> for invoices and payments, or{' '}
        <strong>staff</strong> scoped to the pillar you work in.
      </div>
      <p className="muted">
        If you think you should already have one, it is worth checking you signed in with your
        Bruntsfield account rather than a personal one.
      </p>
    </div>
  );
}
