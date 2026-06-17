import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { servicesApi } from '../../api/servicesApi';

export const loadCategories = createAsyncThunk('services/loadCategories', async () => servicesApi.listCategories());

export const loadProviders = createAsyncThunk(
  'services/loadProviders',
  async ({ category, genderPref } = {}) => servicesApi.listProviders({ category, genderPref }),
);

export const loadMyBookings = createAsyncThunk(
  'services/loadMine',
  async ({ category } = {}) => servicesApi.listMine({ category }),
);

export const bookService = createAsyncThunk(
  'services/book',
  async (payload, { rejectWithValue }) => {
    try {
      return await servicesApi.book(payload);
    } catch (e) {
      return rejectWithValue(e?.response?.data?.message || 'Could not book service');
    }
  },
);

const initialState = {
  categories: [],
  providers: [],
  providersLoading: false,
  bookings: [],
  bookingsLoading: false,
  bookBusy: false,
  error: null,
};

const servicesSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(loadCategories.fulfilled, (state, action) => { state.categories = action.payload; })

      .addCase(loadProviders.pending, state => { state.providersLoading = true; })
      .addCase(loadProviders.fulfilled, (state, action) => { state.providersLoading = false; state.providers = action.payload; })
      .addCase(loadProviders.rejected, state => { state.providersLoading = false; })

      .addCase(loadMyBookings.pending, state => { state.bookingsLoading = true; })
      .addCase(loadMyBookings.fulfilled, (state, action) => { state.bookingsLoading = false; state.bookings = action.payload; })
      .addCase(loadMyBookings.rejected, state => { state.bookingsLoading = false; })

      .addCase(bookService.pending, state => { state.bookBusy = true; state.error = null; })
      .addCase(bookService.fulfilled, state => { state.bookBusy = false; })
      .addCase(bookService.rejected, (state, action) => { state.bookBusy = false; state.error = action.payload; });
  },
});

export default servicesSlice.reducer;
