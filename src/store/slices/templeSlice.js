import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { spiritualApi } from '../../api/spiritualApi';

export const loadTemples = createAsyncThunk('temple/loadTemples', async () => spiritualApi.listTemples());
export const loadTemple = createAsyncThunk('temple/loadTemple', async id => spiritualApi.getTemple(id));
export const loadFestivals = createAsyncThunk('temple/loadFestivals', async () => spiritualApi.listFestivals());
export const loadMyDarshan = createAsyncThunk('temple/loadDarshan', async () => spiritualApi.listMyDarshan());

export const bookDarshan = createAsyncThunk(
  'temple/bookDarshan',
  async ({ payload, isVip }, { rejectWithValue }) => {
    try { return await spiritualApi.bookDarshan(payload, isVip); }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'Could not book darshan'); }
  },
);

const initialState = {
  temples: [],
  templesLoading: false,
  active: null,
  activeLoading: false,
  festivals: [],
  darshanBookings: [],
  darshanLoading: false,
  bookBusy: false,
  error: null,
};

const templeSlice = createSlice({
  name: 'temple',
  initialState,
  reducers: {
    clearActive(state) { state.active = null; },
  },
  extraReducers: builder => {
    builder
      .addCase(loadTemples.pending, state => { state.templesLoading = true; })
      .addCase(loadTemples.fulfilled, (state, action) => { state.templesLoading = false; state.temples = action.payload; })
      .addCase(loadTemples.rejected, state => { state.templesLoading = false; })

      .addCase(loadTemple.pending, state => { state.activeLoading = true; })
      .addCase(loadTemple.fulfilled, (state, action) => { state.activeLoading = false; state.active = action.payload; })
      .addCase(loadTemple.rejected, state => { state.activeLoading = false; })

      .addCase(loadFestivals.fulfilled, (state, action) => { state.festivals = action.payload; })

      .addCase(loadMyDarshan.pending, state => { state.darshanLoading = true; })
      .addCase(loadMyDarshan.fulfilled, (state, action) => { state.darshanLoading = false; state.darshanBookings = action.payload; })
      .addCase(loadMyDarshan.rejected, state => { state.darshanLoading = false; })

      .addCase(bookDarshan.pending, state => { state.bookBusy = true; state.error = null; })
      .addCase(bookDarshan.fulfilled, state => { state.bookBusy = false; })
      .addCase(bookDarshan.rejected, (state, action) => { state.bookBusy = false; state.error = action.payload; });
  },
});

export const { clearActive } = templeSlice.actions;
export default templeSlice.reducer;
