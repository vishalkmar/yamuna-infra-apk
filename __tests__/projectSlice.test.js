jest.mock('../src/api/projectApi', () => ({ projectApi: {} }));

import reducer, {
  clearSelectedMilestone,
  loadProgress, loadUpdates, loadMilestone, setSubscription,
} from '../src/store/slices/projectSlice';

const initial = {
  project: null,
  progressPct: 0,
  currentMilestone: null,
  milestones: [],
  counts: { completed: 0, in_progress: 0, pending: 0, total: 0 },
  updates: [],
  selectedMilestone: null,
  loading: false,
  updatesLoading: false,
  milestoneLoading: false,
  subscriptionBusy: false,
  error: null,
};

describe('projectSlice', () => {
  it('starts in expected initial state', () => {
    expect(reducer(undefined, { type: 'init' })).toEqual(initial);
  });

  it('loadProgress.fulfilled stores project + milestones', () => {
    const payload = {
      project: { id: 1, name: 'VH' },
      progressPct: 57,
      currentMilestone: { id: 3, name: 'Internal Finishing' },
      milestones: [{ id: 1 }, { id: 2 }, { id: 3 }],
      counts: { completed: 2, in_progress: 1, pending: 0, total: 3 },
    };
    const s = reducer(initial, { type: loadProgress.fulfilled.type, payload });
    expect(s.progressPct).toBe(57);
    expect(s.milestones).toHaveLength(3);
    expect(s.currentMilestone.name).toBe('Internal Finishing');
  });

  it('loadUpdates.fulfilled stores updates', () => {
    const payload = [{ id: 1, title: 'Week 1' }, { id: 2, title: 'Week 2' }];
    const s = reducer(initial, { type: loadUpdates.fulfilled.type, payload });
    expect(s.updates).toHaveLength(2);
  });

  it('loadMilestone.fulfilled stores selectedMilestone', () => {
    const payload = { id: 1, name: 'Foundation', photos: [{ id: 11 }] };
    const s = reducer(initial, { type: loadMilestone.fulfilled.type, payload });
    expect(s.selectedMilestone.id).toBe(1);
    expect(s.selectedMilestone.photos).toHaveLength(1);
  });

  it('clearSelectedMilestone resets selectedMilestone', () => {
    const dirty = { ...initial, selectedMilestone: { id: 5 } };
    expect(reducer(dirty, clearSelectedMilestone()).selectedMilestone).toBeNull();
  });

  it('setSubscription.fulfilled updates the matching milestone', () => {
    const state = {
      ...initial,
      milestones: [
        { id: 1, name: 'Foundation', notificationsEnabled: false, notificationChannels: ['push'] },
        { id: 3, name: 'Internal Finishing', notificationsEnabled: false, notificationChannels: ['push'] },
      ],
      selectedMilestone: { id: 3, notificationsEnabled: false, notificationChannels: ['push'] },
    };
    const s = reducer(state, {
      type: setSubscription.fulfilled.type,
      payload: { milestoneId: 3, enabled: true, channels: ['push', 'whatsapp'] },
    });
    expect(s.milestones[1].notificationsEnabled).toBe(true);
    expect(s.milestones[1].notificationChannels).toEqual(['push', 'whatsapp']);
    expect(s.selectedMilestone.notificationsEnabled).toBe(true);
    // unrelated milestone untouched
    expect(s.milestones[0].notificationsEnabled).toBe(false);
  });

  it('setSubscription.rejected stores error', () => {
    const s = reducer(initial, { type: setSubscription.rejected.type, payload: 'down' });
    expect(s.subscriptionBusy).toBe(false);
    expect(s.error).toBe('down');
  });
});
