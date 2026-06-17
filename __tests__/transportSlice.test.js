jest.mock('../src/api/transportApi', () => ({ transportApi: {} }));

import reducer, { loadEstimate, bookRide, loadRides, clearEstimate } from '../src/store/slices/transportSlice';

const initial = {
  distanceKm: null, options: [], optionsLoading: false,
  rides: [], ridesLoading: false, bookBusy: false, error: null,
};

describe('transportSlice', () => {
  it('starts in expected initial state', () => {
    expect(reducer(undefined, { type: 'init' })).toEqual(initial);
  });

  it('loadEstimate stores distance + options', () => {
    const pend = reducer(initial, { type: loadEstimate.pending.type });
    expect(pend.optionsLoading).toBe(true);
    const done = reducer(pend, { type: loadEstimate.fulfilled.type, payload: { distanceKm: 4.2, options: [{ type: 'auto' }] } });
    expect(done.optionsLoading).toBe(false);
    expect(done.distanceKm).toBe(4.2);
    expect(done.options).toHaveLength(1);
  });

  it('clearEstimate empties options', () => {
    const state = { ...initial, options: [{ type: 'auto' }], distanceKm: 5 };
    const s = reducer(state, clearEstimate());
    expect(s.options).toEqual([]);
    expect(s.distanceKm).toBeNull();
  });

  it('bookRide lifecycle toggles bookBusy + rejected sets error', () => {
    const pend = reducer(initial, { type: bookRide.pending.type });
    expect(pend.bookBusy).toBe(true);
    expect(reducer(pend, { type: bookRide.fulfilled.type }).bookBusy).toBe(false);
    expect(reducer(initial, { type: bookRide.rejected.type, payload: 'no cars' }).error).toBe('no cars');
  });

  it('loadRides stores rides', () => {
    const s = reducer(initial, { type: loadRides.fulfilled.type, payload: [{ id: 1 }, { id: 2 }] });
    expect(s.rides).toHaveLength(2);
  });
});
