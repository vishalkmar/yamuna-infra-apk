import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { transportApi } from '../../api/transportApi';

export const loadEstimate = createAsyncThunk(
  'transport/estimate',
  async ({ pickup, drop }, { rejectWithValue }) => {
    try { return await transportApi.estimate({ pickup, drop }); }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'Could not estimate fare'); }
  },
);

export const bookRide = createAsyncThunk(
  'transport/book',
  async (payload, { rejectWithValue }) => {
    try { return await transportApi.book(payload); }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'Could not book ride'); }
  },
);

export const loadRides = createAsyncThunk('transport/rides', async () => transportApi.myRides());

const initialState = {
  distanceKm: null,
  options: [],
  optionsLoading: false,
  rides: [],
  ridesLoading: false,
  bookBusy: false,
  error: null,
};

const transportSlice = createSlice({
  name: 'transport',
  initialState,
  reducers: {
    clearEstimate(state) { state.options = []; state.distanceKm = null; },
  },
  extraReducers: builder => {
    builder
      .addCase(loadEstimate.pending, state => { state.optionsLoading = true; state.error = null; })
      .addCase(loadEstimate.fulfilled, (state, action) => {
        state.optionsLoading = false;
        state.distanceKm = action.payload.distanceKm;
        state.options = action.payload.options || [];
      })
      .addCase(loadEstimate.rejected, (state, action) => { state.optionsLoading = false; state.error = action.payload; })

      .addCase(bookRide.pending, state => { state.bookBusy = true; state.error = null; })
      .addCase(bookRide.fulfilled, state => { state.bookBusy = false; })
      .addCase(bookRide.rejected, (state, action) => { state.bookBusy = false; state.error = action.payload; })

      .addCase(loadRides.pending, state => { state.ridesLoading = true; })
      .addCase(loadRides.fulfilled, (state, action) => { state.ridesLoading = false; state.rides = action.payload; })
      .addCase(loadRides.rejected, state => { state.ridesLoading = false; });
  },
});

export const { clearEstimate } = transportSlice.actions;
export default transportSlice.reducer;
