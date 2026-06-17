jest.mock('../src/api/moveInApi', () => ({ moveInApi: {} }));

import reducer, {
  loadShifting, bookShifting, loadUtilities, requestUtility,
  loadInteriorPartners, requestReferral,
} from '../src/store/slices/moveInSlice';

const initial = {
  shifting: [],
  shiftingLoading: false,
  shiftingBusy: false,
  utilities: [],
  utilitiesLoading: false,
  utilityBusy: false,
  partners: [],
  partnersLoading: false,
  referralBusy: false,
  error: null,
};

describe('moveInSlice', () => {
  it('starts in expected initial state', () => {
    expect(reducer(undefined, { type: 'init' })).toEqual(initial);
  });

  it('loadShifting.fulfilled stores shifting bookings', () => {
    const s = reducer(initial, { type: loadShifting.fulfilled.type, payload: [{ id: 1 }, { id: 2 }] });
    expect(s.shifting).toHaveLength(2);
    expect(s.shiftingLoading).toBe(false);
  });

  it('bookShifting.rejected stores error and clears busy', () => {
    const pend = reducer(initial, { type: bookShifting.pending.type });
    expect(pend.shiftingBusy).toBe(true);
    const s = reducer(pend, { type: bookShifting.rejected.type, payload: 'No vendors available' });
    expect(s.shiftingBusy).toBe(false);
    expect(s.error).toBe('No vendors available');
  });

  it('loadUtilities.fulfilled stores utilities', () => {
    const s = reducer(initial, { type: loadUtilities.fulfilled.type, payload: [{ id: 1, utilityType: 'water' }] });
    expect(s.utilities).toHaveLength(1);
  });

  it('requestUtility.fulfilled prepends the new request', () => {
    const state = { ...initial, utilities: [{ id: 1, utilityType: 'water' }] };
    const s = reducer(state, { type: requestUtility.fulfilled.type, payload: { id: 2, utilityType: 'internet' } });
    expect(s.utilities).toHaveLength(2);
    expect(s.utilities[0].utilityType).toBe('internet'); // newest first
    expect(s.utilityBusy).toBe(false);
  });

  it('loadInteriorPartners.fulfilled stores partners', () => {
    const s = reducer(initial, { type: loadInteriorPartners.fulfilled.type, payload: [{ id: 1, name: 'X' }] });
    expect(s.partners).toHaveLength(1);
  });

  it('requestReferral lifecycle toggles referralBusy', () => {
    const pend = reducer(initial, { type: requestReferral.pending.type });
    expect(pend.referralBusy).toBe(true);
    const done = reducer(pend, { type: requestReferral.fulfilled.type, payload: { id: 1 } });
    expect(done.referralBusy).toBe(false);
  });
});
