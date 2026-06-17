import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { siteVisitApi } from '../../api/siteVisitApi';

export const loadSlots = createAsyncThunk(
  'siteVisit/loadSlots',
  async ({ projectId, date }) => siteVisitApi.getSlots(projectId, date),
);

export const loadVirtualTours = createAsyncThunk(
  'siteVisit/loadTours',
  async projectId => siteVisitApi.getVirtualTours(projectId),
);

export const loadMyVisits = createAsyncThunk(
  'siteVisit/loadMine',
  async ({ status } = {}) => siteVisitApi.listMine({ status }),
);

export const bookVisit = createAsyncThunk(
  'siteVisit/book',
  async (payload, { rejectWithValue }) => {
    try {
      return await siteVisitApi.book(payload);
    } catch (e) {
      return rejectWithValue(e?.response?.data?.message || 'Booking failed');
    }
  },
);

export const cancelVisit = createAsyncThunk(
  'siteVisit/cancel',
  async ({ visitId, reason }, { rejectWithValue }) => {
    try {
      return await siteVisitApi.cancel(visitId, reason);
    } catch (e) {
      return rejectWithValue(e?.response?.data?.message || 'Cancel failed');
    }
  },
);

export const rescheduleVisit = createAsyncThunk(
  'siteVisit/reschedule',
  async ({ visitId, visitDate, visitTime }, { rejectWithValue }) => {
    try {
      return await siteVisitApi.reschedule(visitId, visitDate, visitTime);
    } catch (e) {
      return rejectWithValue(e?.response?.data?.message || 'Reschedule failed');
    }
  },
);

const initialState = {
  slots: { date: null, blackedOut: false, blocked: false, reason: null, slots: [] },
  slotsLoading: false,
  tours: [],
  toursLoading: false,
  visits: [],
  visitsLoading: false,
  bookBusy: false,
  bookError: null,
  lastBooking: null,
  rescheduleBusy: false,
  cancelBusy: false,
};

const siteVisitSlice = createSlice({
  name: 'siteVisit',
  initialState,
  reducers: {
    clearLastBooking(state) {
      state.lastBooking = null;
      state.bookError = null;
    },
    clearSlots(state) {
      state.slots = initialState.slots;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadSlots.pending, state => { state.slotsLoading = true; })
      .addCase(loadSlots.fulfilled, (state, action) => {
        state.slotsLoading = false;
        state.slots = action.payload;
      })
      .addCase(loadSlots.rejected, state => { state.slotsLoading = false; })

      .addCase(loadVirtualTours.pending, state => { state.toursLoading = true; })
      .addCase(loadVirtualTours.fulfilled, (state, action) => {
        state.toursLoading = false;
        state.tours = action.payload;
      })
      .addCase(loadVirtualTours.rejected, state => { state.toursLoading = false; })

      .addCase(loadMyVisits.pending, state => { state.visitsLoading = true; })
      .addCase(loadMyVisits.fulfilled, (state, action) => {
        state.visitsLoading = false;
        state.visits = action.payload;
      })
      .addCase(loadMyVisits.rejected, state => { state.visitsLoading = false; })

      .addCase(bookVisit.pending, state => { state.bookBusy = true; state.bookError = null; })
      .addCase(bookVisit.fulfilled, (state, action) => {
        state.bookBusy = false;
        state.lastBooking = action.payload;
      })
      .addCase(bookVisit.rejected, (state, action) => {
        state.bookBusy = false;
        state.bookError = action.payload || 'Failed';
      })

      .addCase(cancelVisit.pending, state => { state.cancelBusy = true; })
      .addCase(cancelVisit.fulfilled, (state, action) => {
        state.cancelBusy = false;
        const v = state.visits.find(x => x.id === action.payload.id);
        if (v) v.status = 'cancelled';
      })
      .addCase(cancelVisit.rejected, state => { state.cancelBusy = false; })

      .addCase(rescheduleVisit.pending, state => { state.rescheduleBusy = true; })
      .addCase(rescheduleVisit.fulfilled, (state, action) => {
        state.rescheduleBusy = false;
        const v = state.visits.find(x => x.id === action.payload.id);
        if (v) {
          v.visitDate = action.payload.visitDate;
          v.visitTime = action.payload.visitTime;
          v.status = 'rescheduled';
        }
      })
      .addCase(rescheduleVisit.rejected, state => { state.rescheduleBusy = false; });
  },
});

export const { clearLastBooking, clearSlots } = siteVisitSlice.actions;
export default siteVisitSlice.reducer;
