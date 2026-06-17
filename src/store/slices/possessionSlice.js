import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { possessionApi } from '../../api/possessionApi';

export const loadPossessionStatus = createAsyncThunk(
  'possession/loadStatus',
  async bookingId => possessionApi.getStatus(bookingId),
);

export const bookPossessionAppointment = createAsyncThunk(
  'possession/bookAppointment',
  async ({ bookingId, ...payload }, { rejectWithValue }) => {
    try {
      return await possessionApi.bookAppointment(bookingId, payload);
    } catch (e) {
      return rejectWithValue(e?.response?.data?.message || 'Could not book appointment');
    }
  },
);

const initialState = {
  status: null,
  statusLabel: null,
  progressPct: 0,
  checklist: [],
  documents: [],
  appointment: null,
  loading: false,
  apptBusy: false,
  error: null,
};

const possessionSlice = createSlice({
  name: 'possession',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(loadPossessionStatus.pending, state => { state.loading = true; state.error = null; })
      .addCase(loadPossessionStatus.fulfilled, (state, action) => {
        state.loading = false;
        Object.assign(state, action.payload);
      })
      .addCase(loadPossessionStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || 'Failed to load possession status';
      })

      .addCase(bookPossessionAppointment.pending, state => { state.apptBusy = true; })
      .addCase(bookPossessionAppointment.fulfilled, (state, action) => {
        state.apptBusy = false;
        state.appointment = action.payload;
        state.status = 'scheduled';
        state.statusLabel = 'Scheduled';
      })
      .addCase(bookPossessionAppointment.rejected, state => { state.apptBusy = false; });
  },
});

export default possessionSlice.reducer;
