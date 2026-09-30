import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { auth, signIn, passwordLoginEnabled } from '@/auth';

/**
 * The front door.
 *
 * Google is the primary way in. The email and password form appears only when
 * `HC_PASSWORD_LOGINS` holds at least one account; unset, this page renders exactly as if the
 * second door had never been built.
 *
 * ONE GENERIC FAILURE MESSAGE, on purpose. Which check failed — unknown email, wrong password,
 * throttled — is precisely what somebody guessing wants to learn, and telling them costs us the
 * throttle and the decoy hash that `lib/password-login.ts` goes to trouble to provide.
 *
 * The top bar is hidden here by `body:has(.signin) .topbar` in `app/globals.css`. This screen
 * carries the wordmark itself, and printing the name twice on the one page whose job is to
 * introduce the product would be the same repetition HC-002 had to take out of the top bar.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user?.email) redirect('/');

  const { error } = await searchParams;

  return (
    <section className="signin" data-testid="signin">
      {/* The house lockup: the name, a hairline rule, then the product. The rule matters more
          here than in the top bar, because "OS" is two characters and without it the second line
          reads as a subtitle that got cut off (the same thing HC-002 had to fix). */}
      <div className="wordmark">
        <span className="wordmark-name">Bruntsfield</span>
        <span className="wordmark-rule" aria-hidden="true" />
        <span className="wordmark-sub">OS</span>
      </div>

      <div className="signin-block">
        <h1>Sign in</h1>
        <p className="muted">
          {passwordLoginEnabled
            ? 'Use your Bruntsfield account: Google, or the email and password you were given.'
            : 'Use your Bruntsfield Google account.'}
        </p>
      </div>

      {error ? (
        <div className="signin-block callout callout-error" data-testid="signin-error" role="alert">
          That did not work. Check the address and the password and try again.
        </div>
      ) : null}

      <form
        className="signin-block"
        action={async () => {
          'use server';
          await signIn('google', { redirectTo: '/' });
        }}
      >
        <button className="btn btn-primary signin-wide" type="submit">
          Continue with Google
        </button>
      </form>

      {passwordLoginEnabled ? (
        <form
          className="signin-block"
          data-testid="password-login"
          action={async (formData: FormData) => {
            'use server';
            try {
              await signIn('password', {
                email: String(formData.get('email') ?? ''),
                password: String(formData.get('password') ?? ''),
                redirectTo: '/',
              });
            } catch (err) {
              // Auth.js signals BOTH outcomes by throwing: success is a NEXT_REDIRECT, which must
              // be rethrown, and failure is an AuthError. Swallowing everything here would turn a
              // successful sign-in into a silent no-op.
              if (err instanceof AuthError) redirect('/login?error=1');
              throw err;
            }
          }}
        >
          <p className="muted signin-or">Or with email and password</p>
          <input className="signin-field" type="email" name="email" placeholder="email"
                 autoComplete="username" required aria-label="Email" />
          <input className="signin-field" type="password" name="password" placeholder="password"
                 autoComplete="current-password" required aria-label="Password" />
          <button className="btn" type="submit">Sign in</button>
        </form>
      ) : null}

      <p className="signin-block muted signin-foot">Bruntsfield Capital · Edinburgh</p>
    </section>
  );
}
