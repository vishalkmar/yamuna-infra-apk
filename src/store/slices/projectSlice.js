import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { constructionApi } from '../../api/constructionApi';

// Resident's own properties (for the construction tracker + Home "Your Unit").
export const loadMyProperties = createAsyncThunk(
  'project/loadMyProperties',
  async () => constructionApi.myProperties(),
);

export const loadProgress = createAsyncThunk(
  'project/loadProgress',
  async propertyId => constructionApi.getProgress(propertyId),
);

export const loadUpdates = createAsyncThunk(
  'project/loadUpdates',
  async ({ propertyId, limit }) => constructionApi.getUpdates(propertyId, limit),
);

export const loadMilestone = createAsyncThunk(
  'project/loadMilestone',
  async ({ propertyId, milestoneId }) => constructionApi.getStep(propertyId, milestoneId),
);

const initialState = {
  properties: [],
  selectedPropertyId: null,
  property: null,
  project: null,
  progressPct: 0,
  currentMilestone: null,
  milestones: [],
  counts: { completed: 0, in_progress: 0, pending: 0, total: 0 },
  updates: [],
  selectedMilestone: null,
  propertiesLoading: false,
  loading: false,
  updatesLoading: false,
  milestoneLoading: false,
  error: null,
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    clearSelectedMilestone(state) {
      state.selectedMilestone = null;
    },
    selectProperty(state, action) {
      state.selectedPropertyId = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadMyProperties.pending, state => { state.propertiesLoading = true; })
      .addCase(loadMyProperties.fulfilled, (state, action) => {
        state.propertiesLoading = false;
        state.properties = action.payload || [];
        if (!state.selectedPropertyId && state.properties.length > 0) {
          state.selectedPropertyId = state.properties[0].id;
        }
      })
      .addCase(loadMyProperties.rejected, (state, action) => {
        state.propertiesLoading = false;
        state.error = action.error?.message || 'Failed to load properties';
      })

      .addCase(loadProgress.pending, state => { state.loading = true; state.error = null; })
      .addCase(loadProgress.fulfilled, (state, action) => {
        state.loading = false;
        const p = action.payload;
        state.property = p.property;
        state.project = { name: p.property?.projectName || p.property?.label || 'My Unit' };
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
      .addCase(loadMilestone.rejected, state => { state.milestoneLoading = false; });
  },
});

export const { clearSelectedMilestone, selectProperty } = projectSlice.actions;
export default projectSlice.reducer;
