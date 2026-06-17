jest.mock('../src/api/servicesApi', () => ({ servicesApi: {} }));

import reducer, {
  loadCategories, loadProviders, loadMyBookings, bookService,
} from '../src/store/slices/servicesSlice';

const initial = {
  categories: [],
  providers: [],
  providersLoading: false,
  bookings: [],
  bookingsLoading: false,
  bookBusy: false,
  error: null,
};

describe('servicesSlice', () => {
  it('starts in expected initial state', () => {
    expect(reducer(undefined, { type: 'init' })).toEqual(initial);
  });

  it('loadCategories.fulfilled stores categories', () => {
    const s = reducer(initial, { type: loadCategories.fulfilled.type, payload: [{ id: 1, code: 'cleaning' }] });
    expect(s.categories).toHaveLength(1);
  });

  it('loadProviders lifecycle stores providers', () => {
    const pend = reducer(initial, { type: loadProviders.pending.type });
    expect(pend.providersLoading).toBe(true);
    const done = reducer(pend, { type: loadProviders.fulfilled.type, payload: [{ id: 1 }, { id: 2 }] });
    expect(done.providersLoading).toBe(false);
    expect(done.providers).toHaveLength(2);
  });

  it('loadMyBookings.fulfilled stores bookings', () => {
    const s = reducer(initial, { type: loadMyBookings.fulfilled.type, payload: [{ id: 1, status: 'booked' }] });
    expect(s.bookings).toHaveLength(1);
  });

  it('bookService lifecycle: pending → fulfilled clears busy', () => {
    const pend = reducer(initial, { type: bookService.pending.type });
    expect(pend.bookBusy).toBe(true);
    const done = reducer(pend, { type: bookService.fulfilled.type, payload: { id: 5 } });
    expect(done.bookBusy).toBe(false);
  });

  it('bookService.rejected stores error', () => {
    const s = reducer(initial, { type: bookService.rejected.type, payload: 'Unknown service category' });
    expect(s.bookBusy).toBe(false);
    expect(s.error).toBe('Unknown service category');
  });
});
