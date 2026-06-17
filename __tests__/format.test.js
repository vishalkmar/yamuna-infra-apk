import { formatINR, formatDate, daysUntil } from '../src/utils/format';

describe('formatINR', () => {
  it('formats a whole-rupee amount in Indian numbering', () => {
    expect(formatINR(1250000)).toMatch(/₹\s*12,50,000/);
  });

  it('handles null / undefined / NaN safely', () => {
    expect(formatINR(null)).toBe('₹0');
    expect(formatINR(undefined)).toBe('₹0');
    expect(formatINR(NaN)).toBe('₹0');
  });
});

describe('formatDate', () => {
  it('formats ISO dates in dd MMM yyyy form', () => {
    expect(formatDate('2026-06-25')).toMatch(/25 Jun 2026/);
  });

  it('returns empty string for falsy input', () => {
    expect(formatDate('')).toBe('');
    expect(formatDate(null)).toBe('');
  });
});

describe('daysUntil', () => {
  it('returns positive count for future dates', () => {
    const future = new Date(Date.now() + 5 * 86400000);
    expect(daysUntil(future.toISOString())).toBe(5);
  });

  it('returns 0 for today', () => {
    expect(daysUntil(new Date().toISOString())).toBe(0);
  });

  it('returns negative count for past dates', () => {
    const past = new Date(Date.now() - 3 * 86400000);
    expect(daysUntil(past.toISOString())).toBe(-3);
  });
});
