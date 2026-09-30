import { describe, expect, it } from 'vitest';
import {
  CurrencyMismatch, NotAnAmount, add, allocate, applyBasisPoints, format, minorUnitsPerMajor,
  money, roundHalfToEven, subtract, sum, zero,
} from '../money';

const usd = (n: number) => money(n, 'USD');

describe('an amount is an integer of minor units with a currency', () => {
  it('refuses major units, which is the mistake that looks right', () => {
    // money(50.00, 'USD') meaning fifty dollars is the one a person actually makes.
    expect(() => money(50.5, 'USD')).toThrow(NotAnAmount);
    expect(() => money(0.1, 'USD')).toThrow(NotAnAmount);
  });

  it('refuses something that is not a currency code', () => {
    for (const bad of ['', 'US', 'DOLLARS', 'usd!']) expect(() => money(1, bad), bad).toThrow(NotAnAmount);
  });

  it('normalises the code so usd and USD are the same currency', () => {
    expect(money(1, 'usd').currency).toBe('USD');
    expect(() => add(money(1, 'usd'), money(1, 'USD'))).not.toThrow();
  });

  it('refuses an amount beyond safe integer range', () => {
    expect(() => money(Number.MAX_SAFE_INTEGER + 2, 'USD')).toThrow(NotAnAmount);
  });
});

describe('two currencies never end up in one sum', () => {
  it('throws rather than converting or picking one', () => {
    expect(() => add(usd(100), money(100, 'GBP'))).toThrow(CurrencyMismatch);
    expect(() => subtract(usd(100), money(100, 'GBP'))).toThrow(CurrencyMismatch);
    expect(() => sum([usd(100), money(100, 'GBP')])).toThrow(CurrencyMismatch);
  });

  it('says why, in a message a person can act on', () => {
    expect(() => add(usd(1), money(1, 'GBP'))).toThrow(/FX rate/);
  });

  it('an empty sum needs a currency, because zero of nothing is not a number either', () => {
    expect(() => sum([])).toThrow(NotAnAmount);
    expect(sum([], 'USD')).toEqual(zero('USD'));
  });
});

describe("banker's rounding, because half-up is biased", () => {
  it('rounds half to even', () => {
    expect(roundHalfToEven(2.5)).toBe(2);
    expect(roundHalfToEven(3.5)).toBe(4);
    expect(roundHalfToEven(-2.5)).toBe(-2);
    expect(roundHalfToEven(2.4)).toBe(2);
    expect(roundHalfToEven(2.6)).toBe(3);
  });

  it('does not drift upward across many lines, the way half-up does', () => {
    // Applied across thousands of commission lines, half-up pulls the total up every time and
    // always in our favour, which is the kind of thing an audit right exists to find.
    const halves = Array.from({ length: 1000 }, (_, i) => i + 0.5);
    const bankers = halves.reduce((acc, v) => acc + roundHalfToEven(v), 0);
    const halfUp = halves.reduce((acc, v) => acc + Math.round(v), 0);
    expect(halfUp - bankers).toBe(500);
  });
});

describe('a commission rate is basis points, not a float', () => {
  it('applies the contract rates from the commercial record', () => {
    // OpenBB year one: 30 % of cash received. USD 100,000.00 is 10,000,000 minor units.
    expect(applyBasisPoints(usd(10_000_000), 3000)).toEqual(usd(3_000_000));
    // Year two, 20 %.
    expect(applyBasisPoints(usd(10_000_000), 2000)).toEqual(usd(2_000_000));
    // Brandfetch redistribution, 7.5 %, which is 750 bps and not a float.
    expect(applyBasisPoints(usd(10_000_000), 750)).toEqual(usd(750_000));
  });

  it('refuses a fractional basis point', () => {
    expect(() => applyBasisPoints(usd(100), 12.5)).toThrow(NotAnAmount);
  });
});

describe('a split adds back up to exactly what was split', () => {
  it('allocates 1000 three ways with nothing lost or invented', () => {
    const parts = allocate(usd(1000), [1, 1, 1]);
    expect(parts.map((p) => p.amountMinor)).toEqual([334, 333, 333]);
    expect(sum(parts).amountMinor).toBe(1000);
  });

  it('holds for awkward amounts and uneven weights', () => {
    for (const [amount, weights] of [
      [100, [1, 1, 1]], [1, [1, 1]], [7, [1, 2, 3]], [10_000_001, [1, 1, 1, 1, 1, 1, 7]],
      [999_999, [50, 30, 20]], [5, [1, 1, 1, 1, 1, 1, 1]],
    ] as const) {
      const parts = allocate(usd(amount), weights);
      expect(sum(parts).amountMinor, `${amount} by ${weights}`).toBe(amount);
      expect(parts.length).toBe(weights.length);
    }
  });

  it('is stable: the same input always splits the same way', () => {
    expect(allocate(usd(100), [1, 1, 1])).toEqual(allocate(usd(100), [1, 1, 1]));
  });

  it('keeps every part in the original currency', () => {
    for (const p of allocate(money(100, 'CHF'), [1, 1])) expect(p.currency).toBe('CHF');
  });

  it('refuses weights that cannot divide anything', () => {
    expect(() => allocate(usd(100), [])).toThrow(NotAnAmount);
    expect(() => allocate(usd(100), [0, 0])).toThrow(NotAnAmount);
    expect(() => allocate(usd(100), [1, -1])).toThrow(NotAnAmount);
    expect(() => allocate(usd(100), [1, NaN])).toThrow(NotAnAmount);
  });
});

describe('rendering an amount', () => {
  it('knows a currency without two decimal places', () => {
    // The bug this test exists for: dividing by a hard-coded 100 showed every yen amount at a
    // hundredth of its value.
    expect(minorUnitsPerMajor('USD')).toBe(100);
    expect(minorUnitsPerMajor('JPY')).toBe(1);
    expect(format(money(1000, 'JPY'))).toContain('1,000');
    expect(format(usd(1000))).toContain('10.00');
  });

  it('shows the code, because this product puts three currencies on one page', () => {
    expect(format(usd(500_000))).toMatch(/USD/);
    expect(format(money(500_000, 'GBP'))).toMatch(/GBP/);
  });
});
