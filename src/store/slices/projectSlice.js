import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { projectApi } from '../../api/projectApi';

export const loadProgress = createAsyncThunk(
  'project/loadProgress',
  async projectId => projectApi.getProgress(projectId),
);

export const loadUpdates = createAsyncThunk(
  'project/loadUpdates',
  async ({ projectId, limit }) => projectApi.getUpdates(projectId, limit),
);

export const loadMilestone = createAsyncThunk(
  'project/loadMilestone',
  async ({ projectId, milestoneId }) => projectApi.getMilestone(projectId, milestoneId),
);

export const setSubscription = createAsyncThunk(
  'project/setSubscription',
  async ({ projectId, milestoneId, enabled, channels }, { rejectWithValue }) => {
    try {
      return await projectApi.setSubscription(projectId, milestoneId, { enabled, channels });
    } catch (e) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to update notifications');
    }
  },
);

const initialState = {
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

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    clearSelectedMilestone(state) {
      state.selectedMilestone = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadProgress.pending, state => { state.loading = true; state.error = null; })
      .addCase(loadProgress.fulfilled, (state, action) => {
        state.loading = false;
        const p = action.payload;
        state.project = p.project;
        state.progressPct = p.progressPct;
        state.currentMilestone = p.currentMilestone;
        state.milestones = p.milestones;
        state.counts = p.counts;
      })
      .addCase(loadProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || 'Failed to load progress';
      })

      .addCase(loadUpdates.pending, state => { state.updatesLoading = true; })
      .addCase(loadUpdates.fulfilled, (state, action) => {
        state.updatesLoading = false;
        state.updates = action.payload;
      })
      .addCase(loadUpdates.rejected, state => { state.updatesLoading = false; })

      .addCase(loadMilestone.pending, state => { state.milestoneLoading = true; })
      .addCase(loadMilestone.fulfilled, (state, action) => {
        state.milestoneLoading = false;
        state.selectedMilestone = action.payload;
      })
      .addCase(loadMilestone.rejected, state => { state.milestoneLoading = false; })

      .addCase(setSubscription.pending, state => { state.subscriptionBusy = true; })
      .addCase(setSubscription.fulfilled, (state, action) => {
        state.subscriptionBusy = false;
        const { milestoneId, enabled, channels } = action.payload;
        const m = state.milestones.find(x => x.id === milestoneId);
        if (m) {
          m.notificationsEnabled = enabled;
          m.notificationChannels = channels;
        }
        if (state.selectedMilestone?.id === milestoneId) {
          state.selectedMilestone.notificationsEnabled = enabled;
          state.selectedMilestone.notificationChannels = channels;
        }
      })
      .addCase(setSubscription.rejected, (state, action) => {
        state.subscriptionBusy = false;
        state.error = action.payload || 'Failed';
      });
  },
});

export const { clearSelectedMilestone } = projectSlice.actions;
export default projectSlice.reducer;
