import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supportApi } from '../../api/supportApi';

export const loadTickets = createAsyncThunk(
  'support/loadTickets',
  async ({ status } = {}) => supportApi.listTickets({ status }),
);

export const loadTicket = createAsyncThunk(
  'support/loadTicket',
  async ticketId => supportApi.getTicket(ticketId),
);

export const createTicket = createAsyncThunk(
  'support/create',
  async (payload, { rejectWithValue }) => {
    try {
      return await supportApi.createTicket(payload);
    } catch (e) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to submit ticket. Please try again.');
    }
  },
);

export const replyTicket = createAsyncThunk(
  'support/reply',
  async ({ ticketId, body }, { rejectWithValue }) => {
    try {
      return await supportApi.reply(ticketId, body);
    } catch (e) {
      return rejectWithValue(e?.response?.data?.message || 'Reply failed');
    }
  },
);

export const rateTicket = createAsyncThunk(
  'support/rate',
  async ({ ticketId, rating }, { rejectWithValue }) => {
    try {
      await supportApi.rate(ticketId, rating);
      return { ticketId, rating };
    } catch (e) {
      return rejectWithValue(e?.response?.data?.message || 'Rating failed');
    }
  },
);

export const bookAppointment = createAsyncThunk(
  'support/appointment',
  async (payload, { rejectWithValue }) => {
    try {
      return await supportApi.bookAppointment(payload);
    } catch (e) {
      return rejectWithValue(e?.response?.data?.message || 'Could not book appointment');
    }
  },
);

const initialState = {
  tickets: [],
  ticketsLoading: false,
  active: null,
  activeLoading: false,
  createBusy: false,
  createError: null,
  lastCreated: null,
  replyBusy: false,
  rateBusy: false,
  apptBusy: false,
};

const supportSlice = createSlice({
  name: 'support',
  initialState,
  reducers: {
    clearActive(state) {
      state.active = null;
    },
    clearLastCreated(state) {
      state.lastCreated = null;
      state.createError = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadTickets.pending, state => { state.ticketsLoading = true; })
      .addCase(loadTickets.fulfilled, (state, action) => {
        state.ticketsLoading = false;
        state.tickets = action.payload;
      })
      .addCase(loadTickets.rejected, state => { state.ticketsLoading = false; })

      .addCase(loadTicket.pending, state => { state.activeLoading = true; })
      .addCase(loadTicket.fulfilled, (state, action) => {
        state.activeLoading = false;
        state.active = action.payload;
      })
      .addCase(loadTicket.rejected, state => { state.activeLoading = false; })

      .addCase(createTicket.pending, state => { state.createBusy = true; state.createError = null; })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.createBusy = false;
        state.lastCreated = action.payload;
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.createBusy = false;
        state.createError = action.payload || 'Failed';
      })

      .addCase(replyTicket.pending, state => { state.replyBusy = true; })
      .addCase(replyTicket.fulfilled, (state, action) => {
        state.replyBusy = false;
        if (state.active) {
          state.active.messages = [...(state.active.messages || []), action.payload];
          if (['open', 'resolved', 'closed'].includes(state.active.status)) {
            state.active.status = 'in_progress';
          }
        }
      })
      .addCase(replyTicket.rejected, state => { state.replyBusy = false; })

      .addCase(rateTicket.pending, state => { state.rateBusy = true; })
      .addCase(rateTicket.fulfilled, (state, action) => {
        state.rateBusy = false;
        const { ticketId, rating } = action.payload;
        if (state.active && state.active.id === ticketId) state.active.rating = rating;
        const t = state.tickets.find(x => x.id === ticketId);
        if (t) t.rating = rating;
      })
      .addCase(rateTicket.rejected, state => { state.rateBusy = false; })

      .addCase(bookAppointment.pending, state => { state.apptBusy = true; })
      .addCase(bookAppointment.fulfilled, state => { state.apptBusy = false; })
      .addCase(bookAppointment.rejected, state => { state.apptBusy = false; });
  },
});

export const { clearActive, clearLastCreated } = supportSlice.actions;
export default supportSlice.reducer;
