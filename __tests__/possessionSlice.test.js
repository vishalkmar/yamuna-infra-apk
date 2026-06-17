jest.mock('../src/api/possessionApi', () => ({ possessionApi: {} }));

import reducer, {
  loadPossessionStatus, bookPossessionAppointment,
} from '../src/store/slices/possessionSlice';

const initial = {
  status: null,
  statusLabel: null,
  progressPct: 0,
  checklist: [],
  documents: [],
  appointment: null,
  loading: false,
  apptBusy: false,
  error: null,
};

describe('possessionSlice', () => {
  it('starts in expected initial state', () => {
    expect(reducer(undefined, { type: 'init' })).toEqual(initial);
  });

  it('loadPossessionStatus.fulfilled merges the status payload', () => {
    const payload = {
      status: 'ready',
      statusLabel: 'Possession Ready',
      progressPct: 100,
      checklist: [{ id: 1, step: 'X', completed: true }],
      documents: [{ id: 1, name: 'NOC', available: true }],
      appointment: null,
    };
    const s = reducer(initial, { type: loadPossessionStatus.fulfilled.type, payload });
    expect(s.status).toBe('ready');
    expect(s.progressPct).toBe(100);
    expect(s.checklist).toHaveLength(1);
    expect(s.documents[0].name).toBe('NOC');
    expect(s.loading).toBe(false);
  });

  it('loadPossessionStatus.rejected stores error', () => {
    const s = reducer(initial, { type: loadPossessionStatus.rejected.type, error: { message: 'boom' } });
    expect(s.loading).toBe(false);
    expect(s.error).toBe('boom');
  });

  it('bookPossessionAppointment lifecycle sets appointment + flips status to scheduled', () => {
    const ready = { ...initial, status: 'ready', statusLabel: 'Possession Ready' };
    const pend = reducer(ready, { type: bookPossessionAppointment.pending.type });
    expect(pend.apptBusy).toBe(true);
    const done = reducer(pend, {
      type: bookPossessionAppointment.fulfilled.type,
      payload: { id: 9, appointmentDate: '2026-07-01', timeSlot: '09:00 AM – 12:00 PM', attendees: 3, status: 'scheduled' },
    });
    expect(done.apptBusy).toBe(false);
    expect(done.appointment.id).toBe(9);
    expect(done.status).toBe('scheduled');
    expect(done.statusLabel).toBe('Scheduled');
  });

  it('bookPossessionAppointment.rejected clears busy', () => {
    const s = reducer({ ...initial, apptBusy: true }, { type: bookPossessionAppointment.rejected.type, payload: 'no' });
    expect(s.apptBusy).toBe(false);
  });
});
