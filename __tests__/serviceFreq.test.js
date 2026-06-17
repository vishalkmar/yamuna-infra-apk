import { isRecurring, frequencyLabel } from '../src/utils/serviceFreq';

describe('serviceFreq.isRecurring', () => {
  it('daily/weekly/monthly are recurring subscriptions', () => {
    expect(isRecurring('daily')).toBe(true);
    expect(isRecurring('weekly')).toBe(true);
    expect(isRecurring('monthly')).toBe(true);
  });
  it('one-time and unknown frequencies are not recurring', () => {
    expect(isRecurring('one_time')).toBe(false);
    expect(isRecurring('nope')).toBe(false);
    expect(isRecurring(undefined)).toBe(false);
  });
});

describe('serviceFreq.frequencyLabel', () => {
  it('maps to friendly labels, passes through unknowns', () => {
    expect(frequencyLabel('one_time')).toBe('One-time');
    expect(frequencyLabel('weekly')).toBe('Weekly');
    expect(frequencyLabel('xyz')).toBe('xyz');
  });
});
