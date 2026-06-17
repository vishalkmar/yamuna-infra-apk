import {
  parse24, to24, to12hLabel, nextOccurrenceMs, categoryMeta, REMINDER_CATEGORIES,
} from '../src/utils/reminders';

describe('reminder time helpers', () => {
  it('parse24 splits into 12h parts', () => {
    expect(parse24('08:00')).toEqual({ hour12: 8, minute: 0, period: 'AM' });
    expect(parse24('13:30')).toEqual({ hour12: 1, minute: 30, period: 'PM' });
    expect(parse24('00:15')).toEqual({ hour12: 12, minute: 15, period: 'AM' });
    expect(parse24('12:00')).toEqual({ hour12: 12, minute: 0, period: 'PM' });
  });

  it('parse24 falls back to 08:00 on bad input', () => {
    expect(parse24('')).toEqual({ hour12: 8, minute: 0, period: 'AM' });
    expect(parse24(undefined)).toEqual({ hour12: 8, minute: 0, period: 'AM' });
  });

  it('to24 builds a 24h label', () => {
    expect(to24(8, 0, 'AM')).toBe('08:00');
    expect(to24(1, 30, 'PM')).toBe('13:30');
    expect(to24(12, 0, 'AM')).toBe('00:00');
    expect(to24(12, 5, 'PM')).toBe('12:05');
  });

  it('round-trips through to24 / parse24', () => {
    ['00:00', '06:30', '12:00', '13:45', '23:55'].forEach(t => {
      const p = parse24(t);
      expect(to24(p.hour12, p.minute, p.period)).toBe(t);
    });
  });

  it('to12hLabel renders AM/PM', () => {
    expect(to12hLabel('08:00')).toBe('8:00 AM');
    expect(to12hLabel('13:05')).toBe('1:05 PM');
    expect(to12hLabel('00:00')).toBe('12:00 AM');
  });

  it('nextOccurrenceMs picks today if still ahead, else tomorrow', () => {
    const now = new Date('2026-06-09T05:00:00');
    const later = new Date(nextOccurrenceMs('08:00', now));
    expect(later.getDate()).toBe(9);
    expect(later.getHours()).toBe(8);

    const past = new Date(nextOccurrenceMs('04:00', now));
    expect(past.getDate()).toBe(10);
    expect(past.getHours()).toBe(4);
  });

  it('categoryMeta returns a known category or falls back to "other"', () => {
    expect(categoryMeta('medicine').icon).toBe('💊');
    expect(categoryMeta('nope').value).toBe('other');
    expect(REMINDER_CATEGORIES.length).toBeGreaterThanOrEqual(5);
  });
});
