import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { mobilityApi } from '../../api/mobilityApi';

export const loadAids = createAsyncThunk(
  'mobility/loadAids',
  async ({ category } = {}) => mobilityApi.listAids({ category }),
);

export const loadBookings = createAsyncThunk('mobility/loadBookings', async () => mobilityApi.listBookings());

export const bookAid = createAsyncThunk(
  'mobility/book',
  async (payload, { rejectWithValue }) => {
    try { return await mobilityApi.book(payload); }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'Could not book'); }
  },
);

const initialState = {
  aids: [],
  aidsLoading: false,
  bookings: [],
  bookingsLoading: false,
  bookBusy: false,
  error: null,
};

const mobilitySlice = createSlice({
  name: 'mobility',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(loadAids.pending, state => { state.aidsLoading = true; })
      .addCase(loadAids.fulfilled, (state, action) => { state.aidsLoading = false; state.aids = action.payload; })
      .addCase(loadAids.rejected, state => { state.aidsLoading = false; })

      .addCase(loadBookings.pending, state => { state.bookingsLoading = true; })
      .addCase(loadBookings.fulfilled, (state, action) => { state.bookingsLoading = false; state.bookings = action.payload; })
      .addCase(loadBookings.rejected, state => { state.bookingsLoading = false; })

      .addCase(bookAid.pending, state => { state.bookBusy = true; state.error = null; })
      .addCase(bookAid.fulfilled, state => { state.bookBusy = false; })
      .addCase(bookAid.rejected, (state, action) => { state.bookBusy = false; state.error = action.payload; });
  },
});

export default mobilitySlice.reducer;
