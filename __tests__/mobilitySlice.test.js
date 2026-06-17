jest.mock('../src/api/mobilityApi', () => ({ mobilityApi: {} }));

import reducer, { loadAids, loadBookings, bookAid } from '../src/store/slices/mobilitySlice';

const initial = {
  aids: [], aidsLoading: false, bookings: [], bookingsLoading: false, bookBusy: false, error: null,
};

describe('mobilitySlice', () => {
  it('starts in expected initial state', () => {
    expect(reducer(undefined, { type: 'init' })).toEqual(initial);
  });
  it('loadAids.fulfilled stores aids', () => {
    const s = reducer(initial, { type: loadAids.fulfilled.type, payload: [{ id: 1 }, { id: 2 }] });
    expect(s.aids).toHaveLength(2);
  });
  it('loadBookings.fulfilled stores bookings', () => {
    const s = reducer(initial, { type: loadBookings.fulfilled.type, payload: [{ id: 1 }] });
    expect(s.bookings).toHaveLength(1);
  });
  it('bookAid lifecycle toggles bookBusy', () => {
    const pend = reducer(initial, { type: bookAid.pending.type });
    expect(pend.bookBusy).toBe(true);
    const done = reducer(pend, { type: bookAid.fulfilled.type, payload: { id: 1 } });
    expect(done.bookBusy).toBe(false);
  });
  it('bookAid.rejected stores error', () => {
    const s = reducer(initial, { type: bookAid.rejected.type, payload: 'rent only' });
    expect(s.error).toBe('rent only');
  });
});
