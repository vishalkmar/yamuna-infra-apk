import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sosApi } from '../../api/sosApi';

// Admin-managed SOS number + emergency services (shown to the resident).
export const loadContacts = createAsyncThunk('sos/loadContacts', async () => sosApi.getContacts());

export const activateSos = createAsyncThunk(
  'sos/activate',
  async (payload, { rejectWithValue }) => {
    try { return await sosApi.activate(payload || {}); }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'SOS failed'); }
  },
);

const initialState = {
  sosPhone: null,
  services: [],
  contactsLoading: false,
  activating: false,
  activeRequest: null,
  error: null,
};

const sosSlice = createSlice({
  name: 'sos',
  initialState,
  reducers: {
    clearActiveRequest(state) { state.activeRequest = null; },
  },
  extraReducers: builder => {
    builder
      .addCase(loadContacts.pending, state => { state.contactsLoading = true; })
      .addCase(loadContacts.fulfilled, (state, action) => {
        state.contactsLoading = false;
        state.sosPhone = action.payload?.sosPhone || null;
        state.services = action.payload?.services || [];
      })
      .addCase(loadContacts.rejected, state => { state.contactsLoading = false; })

      .addCase(activateSos.pending, state => { state.activating = true; state.error = null; })
      .addCase(activateSos.fulfilled, (state, action) => {
        state.activating = false;
        state.activeRequest = action.payload;
      })
      .addCase(activateSos.rejected, (state, action) => { state.activating = false; state.error = action.payload; });
  },
});

export const { clearActiveRequest } = sosSlice.actions;
export default sosSlice.reducer;
