import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { rewardsApi } from '../../api/rewardsApi';

export const loadBalance = createAsyncThunk('rewards/balance', async () => rewardsApi.getBalance());
export const loadOffers = createAsyncThunk('rewards/offers', async () => rewardsApi.listOffers());
export const loadInvestments = createAsyncThunk('rewards/investments', async () => rewardsApi.listInvestments());
export const loadReferrals = createAsyncThunk('rewards/referrals', async () => rewardsApi.listReferrals());

export const redeemOffer = createAsyncThunk(
  'rewards/redeem',
  async (offerId, { rejectWithValue }) => {
    try { return await rewardsApi.redeem(offerId); }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'Could not redeem'); }
  },
);

export const submitReferral = createAsyncThunk(
  'rewards/submitReferral',
  async (payload, { rejectWithValue }) => {
    try { return await rewardsApi.submitReferral(payload); }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'Could not submit referral'); }
  },
);

const initialState = {
  points: 0,
  offers: [],
  investments: [],
  referrals: [],
  loading: false,
  redeemBusy: false,
  referralBusy: false,
  error: null,
};

const rewardsSlice = createSlice({
  name: 'rewards',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(loadBalance.pending, state => { state.loading = true; })
      .addCase(loadBalance.fulfilled, (state, action) => { state.loading = false; state.points = action.payload.points; })
      .addCase(loadBalance.rejected, state => { state.loading = false; })
      .addCase(loadOffers.fulfilled, (state, action) => { state.offers = action.payload; })
      .addCase(loadInvestments.fulfilled, (state, action) => { state.investments = action.payload; })
      .addCase(loadReferrals.fulfilled, (state, action) => { state.referrals = action.payload; })

      .addCase(redeemOffer.pending, state => { state.redeemBusy = true; state.error = null; })
      .addCase(redeemOffer.fulfilled, (state, action) => { state.redeemBusy = false; state.points = action.payload.balance; })
      .addCase(redeemOffer.rejected, (state, action) => { state.redeemBusy = false; state.error = action.payload; })

      .addCase(submitReferral.pending, state => { state.referralBusy = true; state.error = null; })
      .addCase(submitReferral.fulfilled, state => { state.referralBusy = false; })
      .addCase(submitReferral.rejected, (state, action) => { state.referralBusy = false; state.error = action.payload; });
  },
});

export default rewardsSlice.reducer;
