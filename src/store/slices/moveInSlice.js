import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { moveInApi } from '../../api/moveInApi';

// Shifting
export const loadShifting = createAsyncThunk('movein/loadShifting', async () => moveInApi.listShifting());
export const bookShifting = createAsyncThunk(
  'movein/bookShifting',
  async (payload, { rejectWithValue }) => {
    try { return await moveInApi.bookShifting(payload); }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'Could not book shifting'); }
  },
);

// Utilities
export const loadUtilities = createAsyncThunk('movein/loadUtilities', async () => moveInApi.listUtilities());
export const requestUtility = createAsyncThunk(
  'movein/requestUtility',
  async (payload, { rejectWithValue }) => {
    try { return await moveInApi.requestUtility(payload); }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'Could not request activation'); }
  },
);

// Interiors
export const loadInteriorPartners = createAsyncThunk('movein/loadPartners', async () => moveInApi.listInteriorPartners());
export const requestReferral = createAsyncThunk(
  'movein/requestReferral',
  async (payload, { rejectWithValue }) => {
    try { return await moveInApi.requestReferral(payload); }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'Could not send referral'); }
  },
);

const initialState = {
  shifting: [],
  shiftingLoading: false,
  shiftingBusy: false,
  utilities: [],
  utilitiesLoading: false,
  utilityBusy: false,
  partners: [],
  partnersLoading: false,
  referralBusy: false,
  error: null,
};

const moveInSlice = createSlice({
  name: 'movein',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(loadShifting.pending, state => { state.shiftingLoading = true; })
      .addCase(loadShifting.fulfilled, (state, action) => { state.shiftingLoading = false; state.shifting = action.payload; })
      .addCase(loadShifting.rejected, state => { state.shiftingLoading = false; })

      .addCase(bookShifting.pending, state => { state.shiftingBusy = true; state.error = null; })
      .addCase(bookShifting.fulfilled, state => { state.shiftingBusy = false; })
      .addCase(bookShifting.rejected, (state, action) => { state.shiftingBusy = false; state.error = action.payload; })

      .addCase(loadUtilities.pending, state => { state.utilitiesLoading = true; })
      .addCase(loadUtilities.fulfilled, (state, action) => { state.utilitiesLoading = false; state.utilities = action.payload; })
      .addCase(loadUtilities.rejected, state => { state.utilitiesLoading = false; })

      .addCase(requestUtility.pending, state => { state.utilityBusy = true; })
      .addCase(requestUtility.fulfilled, (state, action) => {
        state.utilityBusy = false;
        state.utilities = [action.payload, ...state.utilities];
      })
      .addCase(requestUtility.rejected, state => { state.utilityBusy = false; })

      .addCase(loadInteriorPartners.pending, state => { state.partnersLoading = true; })
      .addCase(loadInteriorPartners.fulfilled, (state, action) => { state.partnersLoading = false; state.partners = action.payload; })
      .addCase(loadInteriorPartners.rejected, state => { state.partnersLoading = false; })

      .addCase(requestReferral.pending, state => { state.referralBusy = true; })
      .addCase(requestReferral.fulfilled, state => { state.referralBusy = false; })
      .addCase(requestReferral.rejected, state => { state.referralBusy = false; });
  },
});

export default moveInSlice.reducer;
