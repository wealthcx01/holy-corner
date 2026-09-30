/**
 * Money. Integers in minor units, with a currency, always.
 *
 * Plan D5 and CLAUDE.md #4. This is a product about contracts and invoices, so getting this wrong
 * is not a rounding bug, it is a wrong number in front of a counterparty.
 *
 * THE FOUR RULES, and why each one is a type or a throw rather than a convention:
 *
 *  1. **Integer minor units.** 5000 pence, never 50.00 pounds. A float cannot hold 0.1 exactly, so
 *     `0.1 + 0.2 !== 0.3`, and a commission of 30 % on a float is a number that drifts every time
 *     it is recomputed. Elite Vault stored money as text and computed on floats; that is the
 *     anti-pattern this file exists to prevent.
 *  2. **A currency on every amount.** Not a column somewhere else, not "the default". The record
 *     holds USD invoices, a GBP milestone and a Swiss counterparty, and an amount without its
 *     currency is not an amount.
 *  3. **Never a sum across currencies.** `add` THROWS. It does not convert, because converting
 *     needs a rate, and a rate needs a date and a source, and an FX conversion is a recorded event
 *     (D5), not something a helper function does silently in the middle of a total.
 *  4. **Banker's rounding when splitting.** And the parts must sum to exactly the whole, which is
 *     a stronger promise than rounding each part correctly.
 */

/** ISO 4217, upper case. Not an enum: the record will meet currencies nobody has listed yet. */
export type Currency = string;

export interface Money {
  /** The amount in MINOR units. 5000 is USD 50.00. An integer, always. */
  readonly amountMinor: number;
  readonly currency: Currency;
}

export class CurrencyMismatch extends Error {
  constructor(a: Currency, b: Currency) {
    super(
      `Refusing to combine ${a} and ${b}. An amount in one currency and an amount in another are ` +
        'not addable without an FX rate, and an FX conversion is a recorded event with a rate, a ' +
        'source and a date (plan D5).',
    );
    this.name = 'CurrencyMismatch';
  }
}

export class NotAnAmount extends Error {
  constructor(what: string) {
    super(`Not a usable amount: ${what}.`);
    this.name = 'NotAnAmount';
  }
}

/** Build a Money, refusing anything that is not a whole number of minor units. */
export function money(amountMinor: number, currency: Currency): Money {
  if (!Number.isInteger(amountMinor)) {
    // Loud, because the caller almost certainly passed major units: money(50.00, 'USD') meaning
    // fifty dollars is fifty CENTS of rounding away from being silently wrong forever.
    throw new NotAnAmount(`${amountMinor} is not a whole number of minor units`);
  }
  if (!Number.isSafeInteger(amountMinor)) throw new NotAnAmount(`${amountMinor} is beyond safe integer range`);
  const code = currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) throw new NotAnAmount(`"${currency}" is not a three-letter currency code`);
  return { amountMinor, currency: code };
}

export const zero = (currency: Currency): Money => money(0, currency);

/** Add. THROWS on a currency mismatch; it does not convert and it does not pick one. */
export function add(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new CurrencyMismatch(a.currency, b.currency);
  return money(a.amountMinor + b.amountMinor, a.currency);
}

export function subtract(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new CurrencyMismatch(a.currency, b.currency);
  return money(a.amountMinor - b.amountMinor, a.currency);
}

/** Sum a list. An empty list needs a currency, because zero of nothing is not a number either. */
export function sum(amounts: readonly Money[], currency?: Currency): Money {
  if (amounts.length === 0) {
    if (!currency) throw new NotAnAmount('an empty sum has no currency, so pass one');
    return zero(currency);
  }
  return amounts.reduce(add);
}

/**
 * Multiply by a rate given in basis points, with BANKER'S ROUNDING.
 *
 * Basis points rather than a float percentage because the contracts are written in them: OpenBB's
 * 30 % is 3000 bps, grassmarket's commission config is already in bps. A rate that arrives as an
 * integer and stays an integer cannot drift.
 *
 * Banker's rounding (half to even) rather than half-up, because half-up is biased: applied across
 * thousands of commission lines it pulls the total up every time, always in our favour, which is
 * exactly the kind of thing an audit right exists to find.
 */
export function applyBasisPoints(amount: Money, basisPoints: number): Money {
  if (!Number.isInteger(basisPoints)) throw new NotAnAmount(`${basisPoints} basis points is not an integer`);
  return money(roundHalfToEven((amount.amountMinor * basisPoints) / 10_000), amount.currency);
}

/** Half to even. `roundHalfToEven(2.5) === 2`, `roundHalfToEven(3.5) === 4`. */
export function roundHalfToEven(value: number): number {
  const floor = Math.floor(value);
  const diff = value - floor;
  if (diff > 0.5) return floor + 1;
  if (diff < 0.5) return floor;
  return floor % 2 === 0 ? floor : floor + 1;
}

/**
 * Split an amount into parts by weight, so that THE PARTS SUM TO EXACTLY THE WHOLE.
 *
 * This is a stronger promise than rounding each part correctly, and it is the one that matters. Any
 * remainder left by rounding is distributed one minor unit at a time, largest fractional part
 * first, so nothing is lost and nothing is invented. Splitting USD 10.00 three ways gives 334, 333,
 * 333, not three 333s and a lost cent.
 */
export function allocate(amount: Money, weights: readonly number[]): Money[] {
  if (weights.length === 0) throw new NotAnAmount('cannot allocate across no parts');
  if (weights.some((w) => !Number.isFinite(w) || w < 0)) throw new NotAnAmount('a weight must be a number and not negative');
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) throw new NotAnAmount('the weights sum to zero, so there is nothing to divide by');

  const exact = weights.map((w) => (amount.amountMinor * w) / total);
  const floors = exact.map((e) => Math.floor(e));
  let remainder = amount.amountMinor - floors.reduce((a, b) => a + b, 0);

  // Largest fractional part first. A stable tiebreak on index, so the same input always produces
  // the same split - a total that moves between two runs is the thing nobody can reconcile.
  const order = exact
    .map((e, i) => ({ i, frac: e - Math.floor(e) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);

  const out = floors.slice();
  for (let k = 0; remainder > 0; k = (k + 1) % order.length) {
    out[order[k].i] += 1;
    remainder -= 1;
  }
  return out.map((v) => money(v, amount.currency));
}

/**
 * How many minor units make one major unit of this currency.
 *
 * NOT ALWAYS 100. Japanese yen has no minor unit at all, so 1000 minor units is 1,000 yen and not
 * 10. Dividing by a hard-coded 100 would have shown every yen amount at a hundredth of its value,
 * on a screen, to somebody deciding something. Asked of `Intl` rather than kept as a table here,
 * because a table of currency exponents is one more thing to maintain and get wrong.
 */
export function minorUnitsPerMajor(currency: Currency): number {
  const digits = new Intl.NumberFormat('en', { style: 'currency', currency })
    .resolvedOptions().maximumFractionDigits;
  // `maximumFractionDigits` is optional in the type. It is always present for a currency format,
  // but defaulting to 2 rather than asserting means an unexpected runtime cannot crash a screen
  // over a rendering detail - and 2 is right for all but a handful of currencies.
  return 10 ** (digits ?? 2);
}

/**
 * For a screen. Uses the platform's own currency formatting, so a reader sees the convention they
 * expect, and the CODE rather than the symbol, because this product shows USD, GBP and CHF on the
 * same page and "$" alone does not say which dollar.
 */
export function format(amount: Money, locale = 'en-GB'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: amount.currency,
    currencyDisplay: 'code',
  }).format(amount.amountMinor / minorUnitsPerMajor(amount.currency));
}
