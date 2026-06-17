jest.mock('../src/api/siteVisitApi', () => ({ siteVisitApi: {} }));

import reducer, {
  clearLastBooking, clearSlots,
  loadSlots, loadVirtualTours, loadMyVisits,
  bookVisit, cancelVisit, rescheduleVisit,
} from '../src/store/slices/siteVisitSlice';

const initial = {
  slots: { date: null, blackedOut: false, blocked: false, reason: null, slots: [] },
  slotsLoading: false,
  tours: [],
  toursLoading: false,
  visits: [],
  visitsLoading: false,
  bookBusy: false,
  bookError: null,
  lastBooking: null,
  rescheduleBusy: false,
  cancelBusy: false,
};

describe('siteVisitSlice', () => {
  it('starts in expected initial state', () => {
    expect(reducer(undefined, { type: 'init' })).toEqual(initial);
  });

  it('loadSlots.fulfilled stores slot payload', () => {
    const payload = {
      date: '2026-06-10',
      blackedOut: false,
      slots: [{ slotId: 1, slotTime: '10:00:00', available: 6, isFull: false }],
    };
    const s = reducer(initial, { type: loadSlots.fulfilled.type, payload });
    expect(s.slotsLoading).toBe(false);
    expect(s.slots.slots).toHaveLength(1);
    expect(s.slots.date).toBe('2026-06-10');
  });

  it('loadVirtualTours.fulfilled stores tours', () => {
    const payload = [{ id: 1, kind: 'matterport' }, { id: 2, kind: 'maps' }];
    const s = reducer(initial, { type: loadVirtualTours.fulfilled.type, payload });
    expect(s.tours).toHaveLength(2);
    expect(s.toursLoading).toBe(false);
  });

  it('loadMyVisits.fulfilled stores visits', () => {
    const payload = [{ id: 101, status: 'booked' }];
    const s = reducer(initial, { type: loadMyVisits.fulfilled.type, payload });
    expect(s.visits).toHaveLength(1);
  });

  it('bookVisit lifecycle: pending → fulfilled stores lastBooking', () => {
    const pend = reducer(initial, { type: bookVisit.pending.type });
    expect(pend.bookBusy).toBe(true);
    const done = reducer(pend, {
      type: bookVisit.fulfilled.type,
      payload: { id: 5, confirmationCode: 'SV-2026-12345' },
    });
    expect(done.bookBusy).toBe(false);
    expect(done.lastBooking.confirmationCode).toBe('SV-2026-12345');
  });

  it('bookVisit.rejected stores bookError', () => {
    const s = reducer(initial, { type: bookVisit.rejected.type, payload: 'Slot full' });
    expect(s.bookBusy).toBe(false);
    expect(s.bookError).toBe('Slot full');
  });

  it('cancelVisit.fulfilled flips matching visit to cancelled', () => {
    const state = { ...initial, visits: [{ id: 101, status: 'booked' }, { id: 102, status: 'booked' }] };
    const s = reducer(state, { type: cancelVisit.fulfilled.type, payload: { id: 101 } });
    expect(s.visits.find(v => v.id === 101).status).toBe('cancelled');
    expect(s.visits.find(v => v.id === 102).status).toBe('booked');
  });

  it('rescheduleVisit.fulfilled updates date/time/status of matching visit', () => {
    const state = { ...initial, visits: [{ id: 101, visitDate: '2026-06-10', visitTime: '10:00:00', status: 'booked' }] };
    const s = reducer(state, {
      type: rescheduleVisit.fulfilled.type,
      payload: { id: 101, visitDate: '2026-06-12', visitTime: '14:00:00' },
    });
    const v = s.visits.find(x => x.id === 101);
    expect(v.visitDate).toBe('2026-06-12');
    expect(v.visitTime).toBe('14:00:00');
    expect(v.status).toBe('rescheduled');
  });

  it('clearLastBooking + clearSlots reset their state', () => {
    const dirty = {
      ...initial,
      lastBooking: { id: 1 },
      bookError: 'x',
      slots: { ...initial.slots, date: '2026-06-10', slots: [{ slotId: 1 }] },
    };
    expect(reducer(dirty, clearLastBooking()).lastBooking).toBeNull();
    expect(reducer(dirty, clearLastBooking()).bookError).toBeNull();
    expect(reducer(dirty, clearSlots()).slots).toEqual(initial.slots);
  });
});
