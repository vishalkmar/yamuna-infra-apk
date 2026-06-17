jest.mock('../src/api/snagApi', () => ({ snagApi: {} }));

import reducer, {
  clearLastReported, loadSnags, reportSnag, signoffSnag,
} from '../src/store/slices/snagSlice';

const initial = {
  snags: [],
  loading: false,
  reportBusy: false,
  reportError: null,
  lastReported: null,
  signoffBusy: false,
};

describe('snagSlice', () => {
  it('starts in expected initial state', () => {
    expect(reducer(undefined, { type: 'init' })).toEqual(initial);
  });

  it('loadSnags.fulfilled stores snags', () => {
    const payload = [{ id: 1, status: 'open' }, { id: 2, status: 'resolved' }];
    const s = reducer(initial, { type: loadSnags.fulfilled.type, payload });
    expect(s.snags).toHaveLength(2);
    expect(s.loading).toBe(false);
  });

  it('reportSnag lifecycle: pending → fulfilled stores lastReported', () => {
    const pend = reducer(initial, { type: reportSnag.pending.type });
    expect(pend.reportBusy).toBe(true);
    const done = reducer(pend, { type: reportSnag.fulfilled.type, payload: { id: 9, snagCode: 'SN-0009' } });
    expect(done.reportBusy).toBe(false);
    expect(done.lastReported.snagCode).toBe('SN-0009');
  });

  it('reportSnag.rejected stores reportError', () => {
    const s = reducer(initial, { type: reportSnag.rejected.type, payload: 'nope' });
    expect(s.reportBusy).toBe(false);
    expect(s.reportError).toBe('nope');
  });

  it('signoffSnag.fulfilled flips matching snag to signed_off', () => {
    const state = { ...initial, snags: [{ id: 1, status: 'resolved' }, { id: 2, status: 'open' }] };
    const s = reducer(state, { type: signoffSnag.fulfilled.type, payload: { snagId: 1 } });
    expect(s.snags.find(x => x.id === 1).status).toBe('signed_off');
    expect(s.snags.find(x => x.id === 2).status).toBe('open');
  });

  it('clearLastReported resets lastReported + reportError', () => {
    const dirty = { ...initial, lastReported: { id: 1 }, reportError: 'x' };
    const s = reducer(dirty, clearLastReported());
    expect(s.lastReported).toBeNull();
    expect(s.reportError).toBeNull();
  });
});
