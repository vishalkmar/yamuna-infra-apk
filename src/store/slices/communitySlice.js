import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { communityApi } from '../../api/communityApi';

export const loadAnnouncements = createAsyncThunk('community/announcements', async () => communityApi.listAnnouncements());
export const loadEvents = createAsyncThunk('community/events', async () => communityApi.listEvents());
export const loadVisitors = createAsyncThunk('community/visitors', async () => communityApi.visitorHistory());
export const loadAmenities = createAsyncThunk('community/amenities', async () => communityApi.listAmenities());
export const loadAmenitySlots = createAsyncThunk('community/amenitySlots', async ({ amenityId, date }) => communityApi.getSlots(amenityId, date));
export const loadAmenityBookings = createAsyncThunk('community/amenityBookings', async () => communityApi.myAmenityBookings());

export const preAuthorize = createAsyncThunk(
  'community/preAuthorize',
  async (payload, { rejectWithValue }) => {
    try { return await communityApi.preAuthorize(payload); }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'Could not create pass'); }
  },
);

export const bookAmenity = createAsyncThunk(
  'community/bookAmenity',
  async (payload, { rejectWithValue }) => {
    try { return await communityApi.bookAmenity(payload); }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'Could not book'); }
  },
);

const initialState = {
  announcements: [],
  events: [],
  feedLoading: false,
  visitors: [],
  visitorsLoading: false,
  passBusy: false,
  amenities: [],
  amenitiesLoading: false,
  amenitySlots: [],
  slotsLoading: false,
  amenityBookings: [],
  amenityBookingsLoading: false,
  bookBusy: false,
  error: null,
};

const communitySlice = createSlice({
  name: 'community',
  initialState,
  reducers: {
    clearAmenitySlots(state) { state.amenitySlots = []; },
  },
  extraReducers: builder => {
    builder
      .addCase(loadAnnouncements.pending, state => { state.feedLoading = true; })
      .addCase(loadAnnouncements.fulfilled, (state, action) => { state.feedLoading = false; state.announcements = action.payload; })
      .addCase(loadAnnouncements.rejected, state => { state.feedLoading = false; })
      .addCase(loadEvents.fulfilled, (state, action) => { state.events = action.payload; })

      .addCase(loadVisitors.pending, state => { state.visitorsLoading = true; })
      .addCase(loadVisitors.fulfilled, (state, action) => { state.visitorsLoading = false; state.visitors = action.payload; })
      .addCase(loadVisitors.rejected, state => { state.visitorsLoading = false; })

      .addCase(preAuthorize.pending, state => { state.passBusy = true; state.error = null; })
      .addCase(preAuthorize.fulfilled, state => { state.passBusy = false; })
      .addCase(preAuthorize.rejected, (state, action) => { state.passBusy = false; state.error = action.payload; })

      .addCase(loadAmenities.pending, state => { state.amenitiesLoading = true; })
      .addCase(loadAmenities.fulfilled, (state, action) => { state.amenitiesLoading = false; state.amenities = action.payload; })
      .addCase(loadAmenities.rejected, state => { state.amenitiesLoading = false; })

      .addCase(loadAmenitySlots.pending, state => { state.slotsLoading = true; })
      .addCase(loadAmenitySlots.fulfilled, (state, action) => { state.slotsLoading = false; state.amenitySlots = action.payload.slots || []; })
      .addCase(loadAmenitySlots.rejected, state => { state.slotsLoading = false; })

      .addCase(loadAmenityBookings.pending, state => { state.amenityBookingsLoading = true; })
      .addCase(loadAmenityBookings.fulfilled, (state, action) => { state.amenityBookingsLoading = false; state.amenityBookings = action.payload; })
      .addCase(loadAmenityBookings.rejected, state => { state.amenityBookingsLoading = false; })

      .addCase(bookAmenity.pending, state => { state.bookBusy = true; state.error = null; })
      .addCase(bookAmenity.fulfilled, state => { state.bookBusy = false; })
      .addCase(bookAmenity.rejected, (state, action) => { state.bookBusy = false; state.error = action.payload; });
  },
});

export const { clearAmenitySlots } = communitySlice.actions;
export default communitySlice.reducer;
