import { redirect } from 'next/navigation';
import { TONE_MEANING, TONES } from '@/lib/status';
import { landingFor, seesGroupLedger } from '@/lib/nav';
import { currentPrincipal } from '@/lib/session';

/**
 * The placeholder home page.
 *
 * It exists so the shell has something under it to look at, and so the five status tones are on a
 * screen where a person can check them against the two studios side by side. HC-030 replaces it
 * with the group ledger, which is the screen this whole project exists for.
 *
 * It deliberately does NOT invent data. There is no record yet, no connector and no money, and a
 * placeholder that shows plausible-looking figures is how a screen comes to be judged against
 * numbers nobody ever computed.
 */
export default async function Home() {
  // The root routes by role rather than refusing. See `landingFor` in lib/nav.ts for why this one
  // page is different from the other four: everybody arrives here after signing in, so a refusal
  // means signing in produces a 404.
  const principal = await currentPrincipal();
  if (!principal) redirect('/not-authorized');
  if (!seesGroupLedger(principal.role)) redirect(landingFor(principal.role));

  return (
    <div className="measure">
      <p className="eyebrow">Phase 0</p>
      <h1>Bruntsfield OS</h1>
      <p>
        This is the shell every other screen is built inside: the Bruntsfield tokens, the three
        typefaces, the top bar and the sections. There is nothing behind it yet.
      </p>
      <p>
        The record arrives in Phase 1, the view across the group in Phase 2. Until then this page is
        here so the shell can be looked at beside the Advisory Studio and the Foundry Studio, which
        is the only way to tell whether the three read as one product.
      </p>

      <h2>The five status tones</h2>
      <p>
        One vocabulary, defined once in <code>lib/status.ts</code>. A reader learns a colour here and
        it means the same thing on every screen. Nothing in this product names a colour directly.
      </p>
      <dl className="tone-key" data-testid="tone-key">
        {TONES.map((tone) => (
          <div key={tone} className="tone-key-row">
            <dt>
              <span className="tone-key-swatch" data-tone={tone} aria-hidden="true" />
              {tone}
            </dt>
            <dd>{TONE_MEANING[tone]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
