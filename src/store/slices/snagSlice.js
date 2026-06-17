import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { snagApi } from '../../api/snagApi';

export const loadSnags = createAsyncThunk(
  'snag/load',
  async ({ bookingId, status } = {}) => snagApi.list(bookingId, { status }),
);

export const reportSnag = createAsyncThunk(
  'snag/report',
  async ({ bookingId, ...payload }, { rejectWithValue }) => {
    try {
      return await snagApi.report(bookingId, payload);
    } catch (e) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to report snag');
    }
  },
);

export const signoffSnag = createAsyncThunk(
  'snag/signoff',
  async ({ bookingId, snagId }, { rejectWithValue }) => {
    try {
      await snagApi.signoff(bookingId, snagId);
      return { snagId };
    } catch (e) {
      return rejectWithValue(e?.response?.data?.message || 'Sign-off failed');
    }
  },
);

const initialState = {
  snags: [],
  loading: false,
  reportBusy: false,
  reportError: null,
  lastReported: null,
  signoffBusy: false,
};

const snagSlice = createSlice({
  name: 'snag',
  initialState,
  reducers: {
    clearLastReported(state) {
      state.lastReported = null;
      state.reportError = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadSnags.pending, state => { state.loading = true; })
      .addCase(loadSnags.fulfilled, (state, action) => {
        state.loading = false;
        state.snags = action.payload;
      })
      .addCase(loadSnags.rejected, state => { state.loading = false; })

      .addCase(reportSnag.pending, state => { state.reportBusy = true; state.reportError = null; })
      .addCase(reportSnag.fulfilled, (state, action) => {
        state.reportBusy = false;
        state.lastReported = action.payload;
      })
      .addCase(reportSnag.rejected, (state, action) => {
        state.reportBusy = false;
        state.reportError = action.payload || 'Failed';
      })

      .addCase(signoffSnag.pending, state => { state.signoffBusy = true; })
      .addCase(signoffSnag.fulfilled, (state, action) => {
        state.signoffBusy = false;
        const s = state.snags.find(x => x.id === action.payload.snagId);
        if (s) s.status = 'signed_off';
      })
      .addCase(signoffSnag.rejected, state => { state.signoffBusy = false; });
  },
});

export const { clearLastReported } = snagSlice.actions;
export default snagSlice.reducer;
