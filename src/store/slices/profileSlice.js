import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { profileApi } from '../../api/profileApi';

export const loadProfile = createAsyncThunk('profile/load', async () => profileApi.getProfile());

export const savePersonal = createAsyncThunk(
  'profile/savePersonal',
  async (payload, { rejectWithValue }) => {
    try { return await profileApi.updatePersonal(payload); }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'Could not save details'); }
  },
);

export const savePreferences = createAsyncThunk(
  'profile/savePreferences',
  async (payload, { rejectWithValue }) => {
    try { return await profileApi.updatePreferences(payload); }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'Could not save preferences'); }
  },
);

export const addFamily = createAsyncThunk(
  'profile/addFamily',
  async (payload, { rejectWithValue }) => {
    try { await profileApi.addFamilyMember(payload); return true; }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'Could not add member'); }
  },
);

export const editFamily = createAsyncThunk(
  'profile/editFamily',
  async ({ id, ...payload }, { rejectWithValue }) => {
    try { await profileApi.updateFamilyMember(id, payload); return true; }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'Could not update member'); }
  },
);

export const removeFamily = createAsyncThunk('profile/removeFamily', async id => {
  await profileApi.removeFamilyMember(id);
  return { id };
});

export const submitKyc = createAsyncThunk(
  'profile/submitKyc',
  async (payload, { rejectWithValue }) => {
    try { return await profileApi.submitKyc(payload); }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'Could not submit KYC'); }
  },
);

const initialState = {
  personal: null,
  preferences: null,
  family: [],
  kyc: null,
  loading: false,
  saveBusy: false,
  error: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(loadProfile.pending, state => { state.loading = true; })
      .addCase(loadProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.personal = action.payload.personal;
        state.preferences = action.payload.preferences;
        state.family = action.payload.family || [];
        state.kyc = action.payload.kyc;
      })
      .addCase(loadProfile.rejected, state => { state.loading = false; })

      .addCase(savePersonal.pending, state => { state.saveBusy = true; state.error = null; })
      .addCase(savePersonal.fulfilled, (state, action) => { state.saveBusy = false; state.personal = action.payload; })
      .addCase(savePersonal.rejected, (state, action) => { state.saveBusy = false; state.error = action.payload; })

      .addCase(savePreferences.pending, state => { state.saveBusy = true; state.error = null; })
      .addCase(savePreferences.fulfilled, (state, action) => { state.saveBusy = false; state.preferences = action.payload; })
      .addCase(savePreferences.rejected, (state, action) => { state.saveBusy = false; state.error = action.payload; })

      .addCase(addFamily.pending, state => { state.saveBusy = true; })
      .addCase(addFamily.fulfilled, state => { state.saveBusy = false; })
      .addCase(addFamily.rejected, (state, action) => { state.saveBusy = false; state.error = action.payload; })

      .addCase(editFamily.pending, state => { state.saveBusy = true; })
      .addCase(editFamily.fulfilled, state => { state.saveBusy = false; })
      .addCase(editFamily.rejected, (state, action) => { state.saveBusy = false; state.error = action.payload; })

      .addCase(removeFamily.fulfilled, (state, action) => {
        state.family = state.family.filter(m => m.id !== action.payload.id);
      })

      .addCase(submitKyc.pending, state => { state.saveBusy = true; state.error = null; })
      .addCase(submitKyc.fulfilled, (state, action) => { state.saveBusy = false; state.kyc = action.payload; })
      .addCase(submitKyc.rejected, (state, action) => { state.saveBusy = false; state.error = action.payload; });
  },
});

export default profileSlice.reducer;
