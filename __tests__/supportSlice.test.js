jest.mock('../src/api/supportApi', () => ({ supportApi: {} }));

import reducer, {
  clearActive, clearLastCreated,
  loadTickets, loadTicket, createTicket, replyTicket, rateTicket, bookAppointment,
} from '../src/store/slices/supportSlice';

const initial = {
  tickets: [],
  ticketsLoading: false,
  active: null,
  activeLoading: false,
  createBusy: false,
  createError: null,
  lastCreated: null,
  replyBusy: false,
  rateBusy: false,
  apptBusy: false,
};

describe('supportSlice', () => {
  it('starts in expected initial state', () => {
    expect(reducer(undefined, { type: 'init' })).toEqual(initial);
  });

  it('loadTickets.fulfilled stores tickets', () => {
    const payload = [{ id: 1, status: 'open' }, { id: 2, status: 'resolved' }];
    const s = reducer(initial, { type: loadTickets.fulfilled.type, payload });
    expect(s.tickets).toHaveLength(2);
    expect(s.ticketsLoading).toBe(false);
  });

  it('loadTicket.fulfilled stores active ticket with thread', () => {
    const payload = { id: 42, subject: 'X', messages: [{ id: 1, author: 'user', body: 'hi' }] };
    const s = reducer(initial, { type: loadTicket.fulfilled.type, payload });
    expect(s.active.id).toBe(42);
    expect(s.active.messages).toHaveLength(1);
  });

  it('createTicket lifecycle: pending → fulfilled stores lastCreated', () => {
    const pend = reducer(initial, { type: createTicket.pending.type });
    expect(pend.createBusy).toBe(true);
    const done = reducer(pend, { type: createTicket.fulfilled.type, payload: { id: 7, ticketCode: 'SR-2026-10007' } });
    expect(done.createBusy).toBe(false);
    expect(done.lastCreated.ticketCode).toBe('SR-2026-10007');
  });

  it('createTicket.rejected stores createError', () => {
    const s = reducer(initial, { type: createTicket.rejected.type, payload: 'boom' });
    expect(s.createBusy).toBe(false);
    expect(s.createError).toBe('boom');
  });

  it('replyTicket.fulfilled appends to active thread and re-opens resolved', () => {
    const state = {
      ...initial,
      active: { id: 42, status: 'resolved', messages: [{ id: 1, author: 'agent', body: 'done' }] },
    };
    const s = reducer(state, { type: replyTicket.fulfilled.type, payload: { id: 2, author: 'user', body: 'still broken' } });
    expect(s.active.messages).toHaveLength(2);
    expect(s.active.status).toBe('in_progress');
  });

  it('rateTicket.fulfilled sets rating on active + matching list item', () => {
    const state = {
      ...initial,
      active: { id: 42, rating: null },
      tickets: [{ id: 42, rating: null }, { id: 43, rating: null }],
    };
    const s = reducer(state, { type: rateTicket.fulfilled.type, payload: { ticketId: 42, rating: 5 } });
    expect(s.active.rating).toBe(5);
    expect(s.tickets.find(t => t.id === 42).rating).toBe(5);
    expect(s.tickets.find(t => t.id === 43).rating).toBeNull();
  });

  it('bookAppointment lifecycle toggles apptBusy', () => {
    const pend = reducer(initial, { type: bookAppointment.pending.type });
    expect(pend.apptBusy).toBe(true);
    const done = reducer(pend, { type: bookAppointment.fulfilled.type, payload: { id: 1 } });
    expect(done.apptBusy).toBe(false);
  });

  it('clearActive + clearLastCreated reset their state', () => {
    const dirty = { ...initial, active: { id: 1 }, lastCreated: { id: 1 }, createError: 'x' };
    expect(reducer(dirty, clearActive()).active).toBeNull();
    expect(reducer(dirty, clearLastCreated()).lastCreated).toBeNull();
    expect(reducer(dirty, clearLastCreated()).createError).toBeNull();
  });
});
