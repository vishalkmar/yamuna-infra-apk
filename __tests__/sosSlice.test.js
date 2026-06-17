jest.mock('../src/api/sosApi', () => ({ sosApi: {} }));

import reducer, {
  clearActiveRequest, loadContacts, saveContacts, activateSos, trackAmbulance,
} from '../src/store/slices/sosSlice';

const initial = {
  contacts: [],
  bloodGroup: null,
  medicalNotes: null,
  contactsLoading: false,
  saveBusy: false,
  activating: false,
  activeRequest: null,
  error: null,
};

describe('sosSlice', () => {
  it('starts in expected initial state', () => {
    expect(reducer(undefined, { type: 'init' })).toEqual(initial);
  });

  it('loadContacts.fulfilled stores contacts + medical profile', () => {
    const payload = { contacts: [{ id: 1, name: 'Ramesh' }], bloodGroup: 'O+', medicalNotes: 'None' };
    const s = reducer(initial, { type: loadContacts.fulfilled.type, payload });
    expect(s.contacts).toHaveLength(1);
    expect(s.bloodGroup).toBe('O+');
    expect(s.medicalNotes).toBe('None');
  });

  it('saveContacts.fulfilled marks the first contact primary', () => {
    const payload = { contacts: [{ name: 'A', phone: '9', relation: 'son' }, { name: 'B', phone: '8', relation: 'spouse' }], bloodGroup: 'B+' };
    const s = reducer(initial, { type: saveContacts.fulfilled.type, payload });
    expect(s.contacts[0].isPrimary).toBe(true);
    expect(s.contacts[1].isPrimary).toBe(false);
    expect(s.bloodGroup).toBe('B+');
  });

  it('activateSos lifecycle stores the active request', () => {
    const pend = reducer(initial, { type: activateSos.pending.type });
    expect(pend.activating).toBe(true);
    const done = reducer(pend, {
      type: activateSos.fulfilled.type,
      payload: { id: 5, requestCode: 'SOS-2026-100005', status: 'dispatched', etaMinutes: 9 },
    });
    expect(done.activating).toBe(false);
    expect(done.activeRequest.requestCode).toBe('SOS-2026-100005');
  });

  it('activateSos.rejected stores error', () => {
    const s = reducer(initial, { type: activateSos.rejected.type, payload: 'boom' });
    expect(s.activating).toBe(false);
    expect(s.error).toBe('boom');
  });

  it('trackAmbulance.fulfilled updates the active request', () => {
    const state = { ...initial, activeRequest: { id: 5, etaMinutes: 10 } };
    const s = reducer(state, { type: trackAmbulance.fulfilled.type, payload: { id: 5, etaMinutes: 4, status: 'dispatched' } });
    expect(s.activeRequest.etaMinutes).toBe(4);
  });

  it('clearActiveRequest resets it', () => {
    const s = reducer({ ...initial, activeRequest: { id: 1 } }, clearActiveRequest());
    expect(s.activeRequest).toBeNull();
  });
});
