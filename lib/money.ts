/**
 * Amount arithmetic. Integers in minor units, with a currency, always.
 *
 * ## Why the type here is `Amount` and not `Amount`
 *
 * `bcap-contracts` defines `Money` already, and it means something this module does not: a MODELLED
 * figure, carrying the assumptions that justify it. It also defines `RecordedAmount`, an OBSERVED
 * figure carrying the source it was read from. Both are storage and wire shapes, and both require
 * provenance, which is right for a number that has been written down.
 *
 * Arithmetic needs a third thing. The subtotal half way through summing an invoice has no source
 * document and no assumption register: it is an intermediate value that exists for two lines of
 * code. Forcing it to carry provenance would mean inventing a source, and an invented provenance is
 * worse than none because it looks like an answer.
 *
 * So `Amount` is the arithmetic type: minor units and a currency, nothing else. It crosses into the
 * contract types at the boundary, through `toRecordedAmount` and `fromRecordedAmount` below, where
 * the provenance is supplied by the caller who actually knows it.
 *
 * A second type called `Money` in the same codebase, meaning something else, is exactly the drift
 * CLAUDE.md #6 names by filename. A test in `lib/contracts/contracts.test.ts` fails the build if any
 * file outside `lib/contracts/` declares a name the package already owns; it is what caught this.
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

export interface Amount {
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

/** Build an Amount, refusing anything that is not a whole number of minor units. */
export function amount(amountMinor: number, currency: Currency): Amount {
  if (!Number.isInteger(amountMinor)) {
    // Loud, because the caller almost certainly passed major units: amount(50.00, 'USD') meaning
    // fifty dollars is fifty CENTS of rounding away from being silently wrong forever.
    throw new NotAnAmount(`${amountMinor} is not a whole number of minor units`);
  }
  if (!Number.isSafeInteger(amountMinor)) throw new NotAnAmount(`${amountMinor} is beyond safe integer range`);
  const code = currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) throw new NotAnAmount(`"${currency}" is not a three-letter currency code`);
  return { amountMinor, currency: code };
}

export const zero = (currency: Currency): Amount => amount(0, currency);

/** Add. THROWS on a currency mismatch; it does not convert and it does not pick one. */
export function add(a: Amount, b: Amount): Amount {
  if (a.currency !== b.currency) throw new CurrencyMismatch(a.currency, b.currency);
  return amount(a.amountMinor + b.amountMinor, a.currency);
}

export function subtract(a: Amount, b: Amount): Amount {
  if (a.currency !== b.currency) throw new CurrencyMismatch(a.currency, b.currency);
  return amount(a.amountMinor - b.amountMinor, a.currency);
}

/** Sum a list. An empty list needs a currency, because zero of nothing is not a number either. */
export function sum(amounts: readonly Amount[], currency?: Currency): Amount {
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
export function applyBasisPoints(value: Amount, basisPoints: number): Amount {
  if (!Number.isInteger(basisPoints)) throw new NotAnAmount(`${basisPoints} basis points is not an integer`);
  return amount(roundHalfToEven((value.amountMinor * basisPoints) / 10_000), value.currency);
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
export function allocate(value: Amount, weights: readonly number[]): Amount[] {
  if (weights.length === 0) throw new NotAnAmount('cannot allocate across no parts');
  if (weights.some((w) => !Number.isFinite(w) || w < 0)) throw new NotAnAmount('a weight must be a number and not negative');
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) throw new NotAnAmount('the weights sum to zero, so there is nothing to divide by');

  const exact = weights.map((w) => (value.amountMinor * w) / total);
  const floors = exact.map((e) => Math.floor(e));
  let remainder = value.amountMinor - floors.reduce((a, b) => a + b, 0);

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
  return out.map((v) => amount(v, value.currency));
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
export function format(value: Amount, locale = 'en-GB'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: value.currency,
    currencyDisplay: 'code',
  }).format(value.amountMinor / minorUnitsPerMajor(value.currency));
}


// --------------------------------------------------------------------------- //
// The boundary with the contract types
// --------------------------------------------------------------------------- //

/**
 * An `Amount` plus the provenance that makes it storable, as `bcap-contracts` requires.
 *
 * The `sourceRef` is supplied HERE, by the caller who knows where the figure came from, rather than
 * being carried through every intermediate sum. A subtotal has no source; the total written against
 * an invoice line does, and it is the invoice.
 */
export function toRecordedAmount(value: Amount, sourceRef: string): {
  amount_minor: number;
  currency: string;
  source_ref: string;
} {
  if (!sourceRef.trim()) {
    throw new NotAnAmount(
      'a recorded amount needs a source. An amount nobody can trace back to a document is a claim, ' +
        'and this record holds facts',
    );
  }
  return { amount_minor: value.amountMinor, currency: value.currency, source_ref: sourceRef };
}

/** Back the other way, for arithmetic on something read out of the record. */
export function fromRecordedAmount(recorded: {
  amount_minor: number;
  currency: string;
}): Amount {
  return amount(recorded.amount_minor, recorded.currency);
}
