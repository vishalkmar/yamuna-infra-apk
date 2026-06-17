import { computeTotal, ATTENDANT_FEE_PER_DAY } from '../src/utils/mobilityCost';

const aid = { rentPerDay: 150, buyPrice: 6500 };

describe('mobilityCost.computeTotal', () => {
  it('buy mode returns buy price', () => {
    expect(computeTotal(aid, { mode: 'buy', days: 5, withAttendant: true })).toBe(6500);
  });
  it('rent = rentPerDay × days', () => {
    expect(computeTotal(aid, { mode: 'rent', days: 4 })).toBe(600);
  });
  it('rent + attendant adds ₹300/day', () => {
    expect(computeTotal(aid, { mode: 'rent', days: 3, withAttendant: true })).toBe(150 * 3 + ATTENDANT_FEE_PER_DAY * 3);
  });
  it('days floors to at least 1', () => {
    expect(computeTotal(aid, { mode: 'rent', days: 0 })).toBe(150);
  });
  it('returns 0 for missing aid', () => {
    expect(computeTotal(null, { mode: 'rent', days: 3 })).toBe(0);
  });
});
