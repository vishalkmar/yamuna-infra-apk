import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { wellnessApi } from '../../api/wellnessApi';

export const loadTherapies = createAsyncThunk('wellness/loadTherapies', async () => wellnessApi.listTherapies());
export const loadSlots = createAsyncThunk('wellness/loadSlots', async date => wellnessApi.getSlots(date));
export const loadBookings = createAsyncThunk('wellness/loadBookings', async () => wellnessApi.listBookings());

export const bookTherapy = createAsyncThunk(
  'wellness/book',
  async (payload, { rejectWithValue }) => {
    try { return await wellnessApi.book(payload); }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'Could not book'); }
  },
);

const initialState = {
  therapies: [],
  therapiesLoading: false,
  slots: [],
  slotsLoading: false,
  bookings: [],
  bookingsLoading: false,
  bookBusy: false,
  error: null,
};

const wellnessSlice = createSlice({
  name: 'wellness',
  initialState,
  reducers: {
    clearSlots(state) { state.slots = []; },
  },
  extraReducers: builder => {
    builder
      .addCase(loadTherapies.pending, state => { state.therapiesLoading = true; })
      .addCase(loadTherapies.fulfilled, (state, action) => { state.therapiesLoading = false; state.therapies = action.payload; })
      .addCase(loadTherapies.rejected, state => { state.therapiesLoading = false; })

      .addCase(loadSlots.pending, state => { state.slotsLoading = true; })
      .addCase(loadSlots.fulfilled, (state, action) => { state.slotsLoading = false; state.slots = action.payload.slots || []; })
      .addCase(loadSlots.rejected, state => { state.slotsLoading = false; })

      .addCase(loadBookings.pending, state => { state.bookingsLoading = true; })
      .addCase(loadBookings.fulfilled, (state, action) => { state.bookingsLoading = false; state.bookings = action.payload; })
      .addCase(loadBookings.rejected, state => { state.bookingsLoading = false; })

      .addCase(bookTherapy.pending, state => { state.bookBusy = true; state.error = null; })
      .addCase(bookTherapy.fulfilled, state => { state.bookBusy = false; })
      .addCase(bookTherapy.rejected, (state, action) => { state.bookBusy = false; state.error = action.payload; });
  },
});

export const { clearSlots } = wellnessSlice.actions;
export default wellnessSlice.reducer;
