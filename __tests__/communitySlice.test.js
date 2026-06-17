jest.mock('../src/api/communityApi', () => ({ communityApi: {} }));

import reducer, {
  clearAmenitySlots, loadAnnouncements, loadEvents, loadVisitors,
  loadAmenities, loadAmenitySlots, loadAmenityBookings, preAuthorize, bookAmenity,
} from '../src/store/slices/communitySlice';

const initial = {
  announcements: [], events: [], feedLoading: false,
  visitors: [], visitorsLoading: false, passBusy: false,
  amenities: [], amenitiesLoading: false, amenitySlots: [], slotsLoading: false,
  amenityBookings: [], amenityBookingsLoading: false, bookBusy: false, error: null,
};

describe('communitySlice', () => {
  it('starts in expected initial state', () => {
    expect(reducer(undefined, { type: 'init' })).toEqual(initial);
  });
  it('loadAnnouncements + loadEvents store feed', () => {
    expect(reducer(initial, { type: loadAnnouncements.fulfilled.type, payload: [{ id: 1 }] }).announcements).toHaveLength(1);
    expect(reducer(initial, { type: loadEvents.fulfilled.type, payload: [{ id: 1 }, { id: 2 }] }).events).toHaveLength(2);
  });
  it('loadVisitors stores visitors', () => {
    expect(reducer(initial, { type: loadVisitors.fulfilled.type, payload: [{ id: 1 }] }).visitors).toHaveLength(1);
  });
  it('preAuthorize lifecycle toggles passBusy', () => {
    const pend = reducer(initial, { type: preAuthorize.pending.type });
    expect(pend.passBusy).toBe(true);
    expect(reducer(pend, { type: preAuthorize.fulfilled.type, payload: { id: 1 } }).passBusy).toBe(false);
  });
  it('loadAmenities + loadAmenitySlots store data', () => {
    expect(reducer(initial, { type: loadAmenities.fulfilled.type, payload: [{ id: 1 }] }).amenities).toHaveLength(1);
    expect(reducer(initial, { type: loadAmenitySlots.fulfilled.type, payload: { slots: ['06:00-08:00'] } }).amenitySlots).toEqual(['06:00-08:00']);
  });
  it('clearAmenitySlots empties slots', () => {
    expect(reducer({ ...initial, amenitySlots: ['x'] }, clearAmenitySlots()).amenitySlots).toEqual([]);
  });
  it('loadAmenityBookings stores bookings', () => {
    expect(reducer(initial, { type: loadAmenityBookings.fulfilled.type, payload: [{ id: 1 }] }).amenityBookings).toHaveLength(1);
  });
  it('bookAmenity lifecycle + rejected error', () => {
    const pend = reducer(initial, { type: bookAmenity.pending.type });
    expect(pend.bookBusy).toBe(true);
    expect(reducer(pend, { type: bookAmenity.fulfilled.type, payload: { id: 1 } }).bookBusy).toBe(false);
    expect(reducer(initial, { type: bookAmenity.rejected.type, payload: 'maintenance' }).error).toBe('maintenance');
  });
});
