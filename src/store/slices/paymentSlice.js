import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { paymentApi } from '../../api/paymentApi';

export const loadSchedule = createAsyncThunk('payment/loadSchedule', async bookingId => {
  return await paymentApi.getSchedule(bookingId);
});

export const loadHistory = createAsyncThunk(
  'payment/loadHistory',
  async ({ bookingId, search, method, limit } = {}) => {
    return await paymentApi.getHistory(bookingId, { search, method, limit });
  },
);

export const loadLedger = createAsyncThunk('payment/loadLedger', async bookingId => {
  return await paymentApi.getLedger(bookingId);
});

export const initiatePayment = createAsyncThunk(
  'payment/initiate',
  async (payload, { rejectWithValue }) => {
    try {
      return await paymentApi.initiate(payload);
    } catch (e) {
      return rejectWithValue(e?.response?.data?.message || 'Payment initiation failed');
    }
  },
);

export const verifyPayment = createAsyncThunk(
  'payment/verify',
  async ({ orderId }, { rejectWithValue }) => {
    try {
      return await paymentApi.verify(orderId);
    } catch (e) {
      return rejectWithValue(e?.response?.data?.message || 'Verification failed');
    }
  },
);

const initialState = {
  schedule: null,
  history: [],
  ledger: null,
  loading: false,
  historyLoading: false,
  ledgerLoading: false,
  error: null,
  historyFilters: { search: '', method: '' },
  pay: {
    order: null,        // { orderId, paymentLink, paymentSessionId, amount, environment }
    busy: false,
    error: null,
    lastReceipt: null,  // { paymentId, receiptCode } after verify
  },
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    setHistoryFilters: (state, action) => {
      state.historyFilters = { ...state.historyFilters, ...action.payload };
    },
    resetPay: state => {
      state.pay = initialState.pay;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadSchedule.pending, state => { state.loading = true; })
      .addCase(loadSchedule.fulfilled, (state, action) => {
        state.loading = false;
        state.schedule = action.payload;
      })
      .addCase(loadSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message;
      })

      .addCase(loadHistory.pending, state => { state.historyLoading = true; })
      .addCase(loadHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.history = action.payload;
      })
      .addCase(loadHistory.rejected, state => { state.historyLoading = false; })

      .addCase(loadLedger.pending, state => { state.ledgerLoading = true; })
      .addCase(loadLedger.fulfilled, (state, action) => {
        state.ledgerLoading = false;
        state.ledger = action.payload;
      })
      .addCase(loadLedger.rejected, state => { state.ledgerLoading = false; })

      .addCase(initiatePayment.pending, state => {
        state.pay.busy = true;
        state.pay.error = null;
      })
      .addCase(initiatePayment.fulfilled, (state, action) => {
        state.pay.busy = false;
        state.pay.order = action.payload;
      })
      .addCase(initiatePayment.rejected, (state, action) => {
        state.pay.busy = false;
        state.pay.error = action.payload || 'Failed';
      })

      .addCase(verifyPayment.pending, state => { state.pay.busy = true; })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.pay.busy = false;
        state.pay.lastReceipt = {
          paymentId: action.payload.paymentId,
          receiptCode: action.payload.receiptCode,
          status: action.payload.status,
        };
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.pay.busy = false;
        state.pay.error = action.payload || 'Verify failed';
      });
  },
});

export const { setHistoryFilters, resetPay } = paymentSlice.actions;
export default paymentSlice.reducer;
