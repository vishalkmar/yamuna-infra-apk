jest.mock('../src/api/healthcareApi', () => ({ healthcareApi: {} }));

import reducer, {
  clearSlots, loadDoctors, loadSlots, loadMyAppointments, bookAppointment, orderMedicine,
} from '../src/store/slices/healthcareSlice';

const initial = {
  doctors: [],
  doctorsLoading: false,
  slots: [],
  slotsLoading: false,
  appointments: [],
  appointmentsLoading: false,
  bookBusy: false,
  medicineBusy: false,
  error: null,
};

describe('healthcareSlice', () => {
  it('starts in expected initial state', () => {
    expect(reducer(undefined, { type: 'init' })).toEqual(initial);
  });

  it('loadDoctors.fulfilled stores doctors', () => {
    const s = reducer(initial, { type: loadDoctors.fulfilled.type, payload: [{ id: 1 }, { id: 2 }] });
    expect(s.doctors).toHaveLength(2);
  });

  it('loadSlots.fulfilled stores slot array from payload.slots', () => {
    const s = reducer(initial, { type: loadSlots.fulfilled.type, payload: { date: '2026-06-10', slots: ['10:00', '11:00'] } });
    expect(s.slots).toEqual(['10:00', '11:00']);
  });

  it('clearSlots empties slots', () => {
    const s = reducer({ ...initial, slots: ['10:00'] }, clearSlots());
    expect(s.slots).toEqual([]);
  });

  it('loadMyAppointments.fulfilled stores appointments', () => {
    const s = reducer(initial, { type: loadMyAppointments.fulfilled.type, payload: [{ id: 1 }] });
    expect(s.appointments).toHaveLength(1);
  });

  it('bookAppointment lifecycle toggles bookBusy', () => {
    const pend = reducer(initial, { type: bookAppointment.pending.type });
    expect(pend.bookBusy).toBe(true);
    const done = reducer(pend, { type: bookAppointment.fulfilled.type, payload: { id: 1 } });
    expect(done.bookBusy).toBe(false);
  });

  it('bookAppointment.rejected stores error', () => {
    const s = reducer(initial, { type: bookAppointment.rejected.type, payload: 'Doctor not available' });
    expect(s.error).toBe('Doctor not available');
  });

  it('orderMedicine lifecycle toggles medicineBusy', () => {
    const pend = reducer(initial, { type: orderMedicine.pending.type });
    expect(pend.medicineBusy).toBe(true);
    const done = reducer(pend, { type: orderMedicine.fulfilled.type, payload: { id: 1 } });
    expect(done.medicineBusy).toBe(false);
  });
});
