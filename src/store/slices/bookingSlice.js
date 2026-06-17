import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bookingApi } from '../../api/bookingApi';

export const loadBooking = createAsyncThunk('booking/load', async bookingId => {
  const [details, documents] = await Promise.all([
    bookingApi.getDetails(bookingId),
    bookingApi.getDocuments(bookingId),
  ]);
  return { details, documents };
});

export const loadWelcomeKit = createAsyncThunk('booking/loadWelcomeKit', async bookingId => {
  return await bookingApi.getWelcomeKit(bookingId);
});

export const initiateEsign = createAsyncThunk(
  'booking/initiateEsign',
  async ({ bookingId, docId }, { rejectWithValue }) => {
    try {
      return await bookingApi.initiateEsignature(bookingId, docId);
    } catch (e) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to start signing');
    }
  },
);

export const completeEsign = createAsyncThunk(
  'booking/completeEsign',
  async ({ bookingId, docId, envelopeId, status = 'signed', notes }, { rejectWithValue }) => {
    try {
      return await bookingApi.completeEsignature(bookingId, docId, { envelopeId, status, notes });
    } catch (e) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to complete signing');
    }
  },
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    details: null,
    documents: [],
    welcomeKit: null,
    welcomeKitLoading: false,
    loading: false,
    error: null,
    esign: {
      envelopeId: null,
      signingUrl: null,
      docId: null,
      busy: false,
      error: null,
    },
  },
  reducers: {
    resetEsign: state => {
      state.esign = { envelopeId: null, signingUrl: null, docId: null, busy: false, error: null };
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadBooking.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.details = action.payload.details;
        state.documents = action.payload.documents;
      })
      .addCase(loadBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || 'Failed to load booking';
      })
      .addCase(loadWelcomeKit.pending, state => {
        state.welcomeKitLoading = true;
      })
      .addCase(loadWelcomeKit.fulfilled, (state, action) => {
        state.welcomeKitLoading = false;
        state.welcomeKit = action.payload;
      })
      .addCase(loadWelcomeKit.rejected, state => {
        state.welcomeKitLoading = false;
      })
      .addCase(initiateEsign.pending, (state, action) => {
        state.esign.busy = true;
        state.esign.error = null;
        state.esign.docId = action.meta.arg.docId;
      })
      .addCase(initiateEsign.fulfilled, (state, action) => {
        state.esign.busy = false;
        state.esign.envelopeId = action.payload.envelopeId;
        state.esign.signingUrl = action.payload.signingUrl;
      })
      .addCase(initiateEsign.rejected, (state, action) => {
        state.esign.busy = false;
        state.esign.error = action.payload || 'Failed to initiate signing';
      })
      .addCase(completeEsign.pending, state => {
        state.esign.busy = true;
      })
      .addCase(completeEsign.fulfilled, (state, action) => {
        state.esign.busy = false;
        const idx = state.documents.findIndex(d => String(d.id) === String(action.payload.id));
        if (idx >= 0) {
          state.documents[idx] = {
            ...state.documents[idx],
            signedAt: action.payload.signedAt,
            status: action.payload.signedAt ? 'signed' : state.documents[idx].status,
          };
        }
      })
      .addCase(completeEsign.rejected, (state, action) => {
        state.esign.busy = false;
        state.esign.error = action.payload || 'Failed to complete signing';
      });
  },
});

export const { resetEsign } = bookingSlice.actions;
export default bookingSlice.reducer;
