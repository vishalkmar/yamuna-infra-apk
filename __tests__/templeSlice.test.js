jest.mock('../src/api/spiritualApi', () => ({ spiritualApi: {} }));

import reducer, {
  clearActive, loadTemples, loadTemple, loadFestivals, loadMyDarshan, bookDarshan,
} from '../src/store/slices/templeSlice';

const initial = {
  temples: [], templesLoading: false, active: null, activeLoading: false,
  festivals: [], darshanBookings: [], darshanLoading: false, bookBusy: false, error: null,
};

describe('templeSlice', () => {
  it('starts in expected initial state', () => {
    expect(reducer(undefined, { type: 'init' })).toEqual(initial);
  });
  it('loadTemples.fulfilled stores temples', () => {
    const s = reducer(initial, { type: loadTemples.fulfilled.type, payload: [{ id: 1 }, { id: 2 }] });
    expect(s.temples).toHaveLength(2);
  });
  it('loadTemple.fulfilled stores active temple', () => {
    const s = reducer(initial, { type: loadTemple.fulfilled.type, payload: { id: 3, name: 'Banke Bihari' } });
    expect(s.active.name).toBe('Banke Bihari');
  });
  it('clearActive resets active', () => {
    expect(reducer({ ...initial, active: { id: 1 } }, clearActive()).active).toBeNull();
  });
  it('loadFestivals + loadMyDarshan store lists', () => {
    expect(reducer(initial, { type: loadFestivals.fulfilled.type, payload: [{ id: 1 }] }).festivals).toHaveLength(1);
    expect(reducer(initial, { type: loadMyDarshan.fulfilled.type, payload: [{ id: 1 }] }).darshanBookings).toHaveLength(1);
  });
  it('bookDarshan lifecycle toggles bookBusy', () => {
    const pend = reducer(initial, { type: bookDarshan.pending.type });
    expect(pend.bookBusy).toBe(true);
    expect(reducer(pend, { type: bookDarshan.fulfilled.type, payload: { id: 1 } }).bookBusy).toBe(false);
  });
  it('bookDarshan.rejected stores error', () => {
    expect(reducer(initial, { type: bookDarshan.rejected.type, payload: 'full' }).error).toBe('full');
  });
});
