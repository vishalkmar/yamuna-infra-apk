jest.mock('../src/api/profileApi', () => ({ profileApi: {} }));

import reducer, {
  loadProfile, savePersonal, savePreferences, addFamily, editFamily, removeFamily, submitKyc,
} from '../src/store/slices/profileSlice';

const initial = {
  personal: null, preferences: null, family: [], kyc: null,
  loading: false, saveBusy: false, error: null,
};

const fullProfile = {
  personal: { name: 'A', email: 'a@b.com' },
  preferences: { language: 'en', channels: { push: true } },
  family: [{ id: 1, name: 'X', relation: 'spouse' }],
  kyc: { status: 'not_started' },
};

describe('profileSlice', () => {
  it('starts in expected initial state', () => {
    expect(reducer(undefined, { type: 'init' })).toEqual(initial);
  });

  it('loadProfile fills all sections', () => {
    const s = reducer(initial, { type: loadProfile.fulfilled.type, payload: fullProfile });
    expect(s.personal.name).toBe('A');
    expect(s.family).toHaveLength(1);
    expect(s.kyc.status).toBe('not_started');
    expect(s.loading).toBe(false);
  });

  it('savePersonal lifecycle updates personal', () => {
    const pend = reducer(initial, { type: savePersonal.pending.type });
    expect(pend.saveBusy).toBe(true);
    const done = reducer(pend, { type: savePersonal.fulfilled.type, payload: { name: 'B' } });
    expect(done.saveBusy).toBe(false);
    expect(done.personal.name).toBe('B');
  });

  it('savePreferences stores preferences', () => {
    const s = reducer(initial, { type: savePreferences.fulfilled.type, payload: { language: 'hi' } });
    expect(s.preferences.language).toBe('hi');
  });

  it('addFamily / editFamily toggle saveBusy', () => {
    expect(reducer(initial, { type: addFamily.pending.type }).saveBusy).toBe(true);
    expect(reducer(initial, { type: addFamily.fulfilled.type }).saveBusy).toBe(false);
    expect(reducer(initial, { type: editFamily.pending.type }).saveBusy).toBe(true);
  });

  it('removeFamily drops the member by id', () => {
    const state = { ...initial, family: [{ id: 1 }, { id: 2 }] };
    const s = reducer(state, { type: removeFamily.fulfilled.type, payload: { id: 1 } });
    expect(s.family).toEqual([{ id: 2 }]);
  });

  it('submitKyc stores returned kyc + rejected sets error', () => {
    const s = reducer(initial, { type: submitKyc.fulfilled.type, payload: { status: 'pending' } });
    expect(s.kyc.status).toBe('pending');
    expect(reducer(initial, { type: submitKyc.rejected.type, payload: 'bad' }).error).toBe('bad');
  });
});
