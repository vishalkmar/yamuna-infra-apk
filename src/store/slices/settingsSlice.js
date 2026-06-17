import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { settingsApi } from '../../api/settingsApi';

export const loadSettings = createAsyncThunk('settings/load', async () => settingsApi.getSettings());

export const saveSettings = createAsyncThunk(
  'settings/save',
  async (payload, { rejectWithValue }) => {
    try { return await settingsApi.updateSettings(payload); }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'Could not save settings'); }
  },
);

const initialState = {
  language: 'en',
  notifications: { master: true, announcements: true, payments: true, services: true, reminders: true },
  privacy: { analytics: true, profileVisible: true, biometricLock: false },
  loading: false,
  saveBusy: false,
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: builder => {
    const apply = (state, p) => {
      state.language = p.language;
      state.notifications = p.notifications;
      state.privacy = p.privacy;
    };
    builder
      .addCase(loadSettings.pending, state => { state.loading = true; })
      .addCase(loadSettings.fulfilled, (state, action) => { state.loading = false; apply(state, action.payload); })
      .addCase(loadSettings.rejected, state => { state.loading = false; })

      .addCase(saveSettings.pending, state => { state.saveBusy = true; state.error = null; })
      .addCase(saveSettings.fulfilled, (state, action) => { state.saveBusy = false; apply(state, action.payload); })
      .addCase(saveSettings.rejected, (state, action) => { state.saveBusy = false; state.error = action.payload; });
  },
});

export default settingsSlice.reducer;
