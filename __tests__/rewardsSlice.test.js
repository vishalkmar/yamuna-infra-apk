jest.mock('../src/api/rewardsApi', () => ({ rewardsApi: {} }));

import reducer, {
  loadBalance, loadOffers, loadInvestments, loadReferrals, redeemOffer, submitReferral,
} from '../src/store/slices/rewardsSlice';

const initial = {
  points: 0, offers: [], investments: [], referrals: [],
  loading: false, redeemBusy: false, referralBusy: false, error: null,
};

describe('rewardsSlice', () => {
  it('starts in expected initial state', () => {
    expect(reducer(undefined, { type: 'init' })).toEqual(initial);
  });
  it('loadBalance.fulfilled stores points', () => {
    const s = reducer(initial, { type: loadBalance.fulfilled.type, payload: { points: 1500 } });
    expect(s.points).toBe(1500);
    expect(s.loading).toBe(false);
  });
  it('loadOffers + loadInvestments + loadReferrals store lists', () => {
    expect(reducer(initial, { type: loadOffers.fulfilled.type, payload: [{ id: 1 }] }).offers).toHaveLength(1);
    expect(reducer(initial, { type: loadInvestments.fulfilled.type, payload: [{ id: 1 }, { id: 2 }] }).investments).toHaveLength(2);
    expect(reducer(initial, { type: loadReferrals.fulfilled.type, payload: [{ id: 1 }] }).referrals).toHaveLength(1);
  });
  it('redeemOffer.fulfilled updates balance', () => {
    const pend = reducer({ ...initial, points: 1500 }, { type: redeemOffer.pending.type });
    expect(pend.redeemBusy).toBe(true);
    const done = reducer(pend, { type: redeemOffer.fulfilled.type, payload: { balance: 1000 } });
    expect(done.redeemBusy).toBe(false);
    expect(done.points).toBe(1000);
  });
  it('redeemOffer.rejected stores error', () => {
    expect(reducer(initial, { type: redeemOffer.rejected.type, payload: 'Not enough points' }).error).toBe('Not enough points');
  });
  it('submitReferral lifecycle toggles referralBusy', () => {
    const pend = reducer(initial, { type: submitReferral.pending.type });
    expect(pend.referralBusy).toBe(true);
    expect(reducer(pend, { type: submitReferral.fulfilled.type, payload: { id: 1 } }).referralBusy).toBe(false);
  });
});
