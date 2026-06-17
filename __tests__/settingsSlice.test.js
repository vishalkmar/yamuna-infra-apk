jest.mock('../src/api/settingsApi', () => ({ settingsApi: {} }));

import reducer, { loadSettings, saveSettings } from '../src/store/slices/settingsSlice';

const initial = {
  language: 'en',
  notifications: { master: true, announcements: true, payments: true, services: true, reminders: true },
  privacy: { analytics: true, profileVisible: true, biometricLock: false },
  loading: false, saveBusy: false, error: null,
};

const payload = {
  language: 'hi',
  notifications: { master: false, announcements: false, payments: true, services: true, reminders: true },
  privacy: { analytics: false, profileVisible: true, biometricLock: true },
};

describe('settingsSlice', () => {
  it('starts in expected initial state', () => {
    expect(reducer(undefined, { type: 'init' })).toEqual(initial);
  });

  it('loadSettings applies returned settings', () => {
    const s = reducer(initial, { type: loadSettings.fulfilled.type, payload });
    expect(s.language).toBe('hi');
    expect(s.notifications.master).toBe(false);
    expect(s.loading).toBe(false);
  });

  it('saveSettings lifecycle toggles saveBusy and applies result', () => {
    const pend = reducer(initial, { type: saveSettings.pending.type });
    expect(pend.saveBusy).toBe(true);
    const done = reducer(pend, { type: saveSettings.fulfilled.type, payload });
    expect(done.saveBusy).toBe(false);
    expect(done.privacy.biometricLock).toBe(true);
  });

  it('saveSettings rejected records error', () => {
    expect(reducer(initial, { type: saveSettings.rejected.type, payload: 'nope' }).error).toBe('nope');
  });
});
