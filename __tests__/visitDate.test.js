import { isIsoDate, dayOfWeek, validateVisitDate, minBookableDate } from '../src/utils/visitDate';

// Fixed reference: 2026-06-10 is a Wednesday (UTC).
// → min bookable = 2026-06-11 (Thu); 2026-06-14 is a Sunday.
const NOW = new Date('2026-06-10T08:00:00Z');

describe('isIsoDate', () => {
  it('accepts well-formed ISO dates', () => {
    expect(isIsoDate('2026-06-11')).toBe(true);
  });
  it.each(['2026/06/11', '11-06-2026', '', null, 'tomorrow'])('rejects %s', bad => {
    expect(isIsoDate(bad)).toBe(false);
  });
});

describe('dayOfWeek', () => {
  it('returns 0 for Sunday and 3 for Wednesday', () => {
    expect(dayOfWeek('2026-06-14')).toBe(0);
    expect(dayOfWeek('2026-06-10')).toBe(3);
  });
});

describe('validateVisitDate', () => {
  it('accepts a valid weekday at least 1 day ahead', () => {
    expect(validateVisitDate('2026-06-11', { now: NOW })).toEqual({ ok: true });
  });

  it('rejects an invalid format', () => {
    expect(validateVisitDate('2026/06/11', { now: NOW }).ok).toBe(false);
  });

  it('rejects same-day / past dates', () => {
    const r = validateVisitDate('2026-06-10', { now: NOW });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/1 day/i);
  });

  it('rejects Sundays', () => {
    const r = validateVisitDate('2026-06-14', { now: NOW });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/sunday/i);
  });
});

describe('minBookableDate', () => {
  it('returns today + 1 in ISO form', () => {
    expect(minBookableDate(NOW)).toBe('2026-06-11');
  });
});
