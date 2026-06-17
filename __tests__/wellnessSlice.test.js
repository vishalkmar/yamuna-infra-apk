jest.mock('../src/api/wellnessApi', () => ({ wellnessApi: {} }));

import reducer, {
  clearSlots, loadTherapies, loadSlots, loadBookings, bookTherapy,
} from '../src/store/slices/wellnessSlice';

const initial = {
  therapies: [], therapiesLoading: false, slots: [], slotsLoading: false,
  bookings: [], bookingsLoading: false, bookBusy: false, error: null,
};

describe('wellnessSlice', () => {
  it('starts in expected initial state', () => {
    expect(reducer(undefined, { type: 'init' })).toEqual(initial);
  });
  it('loadTherapies.fulfilled stores therapies', () => {
    const s = reducer(initial, { type: loadTherapies.fulfilled.type, payload: [{ id: 1 }, { id: 2 }] });
    expect(s.therapies).toHaveLength(2);
  });
  it('loadSlots.fulfilled stores slots from payload.slots', () => {
    const s = reducer(initial, { type: loadSlots.fulfilled.type, payload: { date: '2026-06-10', slots: ['08:00'] } });
    expect(s.slots).toEqual(['08:00']);
  });
  it('clearSlots empties slots', () => {
    expect(reducer({ ...initial, slots: ['08:00'] }, clearSlots()).slots).toEqual([]);
  });
  it('loadBookings.fulfilled stores bookings', () => {
    const s = reducer(initial, { type: loadBookings.fulfilled.type, payload: [{ id: 1 }] });
    expect(s.bookings).toHaveLength(1);
  });
  it('bookTherapy lifecycle toggles bookBusy', () => {
    const pend = reducer(initial, { type: bookTherapy.pending.type });
    expect(pend.bookBusy).toBe(true);
    expect(reducer(pend, { type: bookTherapy.fulfilled.type, payload: { id: 1 } }).bookBusy).toBe(false);
  });
  it('bookTherapy.rejected stores error', () => {
    expect(reducer(initial, { type: bookTherapy.rejected.type, payload: 'busy' }).error).toBe('busy');
  });
});
