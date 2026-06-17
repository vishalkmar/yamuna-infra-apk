import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sosApi } from '../../api/sosApi';

export const loadContacts = createAsyncThunk('sos/loadContacts', async () => sosApi.getContacts());

export const saveContacts = createAsyncThunk(
  'sos/saveContacts',
  async (payload, { rejectWithValue }) => {
    try { await sosApi.saveContacts(payload); return payload; }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'Could not save contacts'); }
  },
);

export const activateSos = createAsyncThunk(
  'sos/activate',
  async (payload, { rejectWithValue }) => {
    try { return await sosApi.activate(payload); }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'SOS failed'); }
  },
);

export const trackAmbulance = createAsyncThunk('sos/track', async requestId => sosApi.track(requestId));

const initialState = {
  contacts: [],
  bloodGroup: null,
  medicalNotes: null,
  contactsLoading: false,
  saveBusy: false,
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
        state.contacts = action.payload.contacts || [];
        state.bloodGroup = action.payload.bloodGroup || null;
        state.medicalNotes = action.payload.medicalNotes || null;
      })
      .addCase(loadContacts.rejected, state => { state.contactsLoading = false; })

      .addCase(saveContacts.pending, state => { state.saveBusy = true; state.error = null; })
      .addCase(saveContacts.fulfilled, (state, action) => {
        state.saveBusy = false;
        state.contacts = (action.payload.contacts || []).map((c, i) => ({ ...c, isPrimary: i === 0 }));
        state.bloodGroup = action.payload.bloodGroup || null;
        state.medicalNotes = action.payload.medicalNotes || null;
      })
      .addCase(saveContacts.rejected, (state, action) => { state.saveBusy = false; state.error = action.payload; })

      .addCase(activateSos.pending, state => { state.activating = true; state.error = null; })
      .addCase(activateSos.fulfilled, (state, action) => {
        state.activating = false;
        state.activeRequest = action.payload;
      })
      .addCase(activateSos.rejected, (state, action) => { state.activating = false; state.error = action.payload; })

      .addCase(trackAmbulance.fulfilled, (state, action) => { state.activeRequest = action.payload; });
  },
});

export const { clearActiveRequest } = sosSlice.actions;
export default sosSlice.reducer;
