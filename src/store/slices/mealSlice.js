import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { mealApi } from '../../api/mealApi';

export const loadMenu = createAsyncThunk(
  'meal/loadMenu',
  async ({ date, dietType } = {}) => mealApi.getMenu(date, { dietType }),
);

export const loadOrders = createAsyncThunk('meal/loadOrders', async () => mealApi.listOrders());
export const loadSubscriptions = createAsyncThunk('meal/loadSubs', async () => mealApi.listSubscriptions());

export const placeOrder = createAsyncThunk(
  'meal/placeOrder',
  async (payload, { rejectWithValue }) => {
    try { return await mealApi.placeOrder(payload); }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'Could not place order'); }
  },
);

export const subscribe = createAsyncThunk(
  'meal/subscribe',
  async (payload, { rejectWithValue }) => {
    try { return await mealApi.subscribe(payload); }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'Could not subscribe'); }
  },
);

const initialState = {
  menu: [],
  menuDate: null,
  menuLoading: false,
  orders: [],
  ordersLoading: false,
  subscriptions: [],
  subsLoading: false,
  orderBusy: false,
  subscribeBusy: false,
  error: null,
};

const mealSlice = createSlice({
  name: 'meal',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(loadMenu.pending, state => { state.menuLoading = true; })
      .addCase(loadMenu.fulfilled, (state, action) => {
        state.menuLoading = false;
        state.menu = action.payload.items;
        state.menuDate = action.payload.date;
      })
      .addCase(loadMenu.rejected, state => { state.menuLoading = false; })

      .addCase(loadOrders.pending, state => { state.ordersLoading = true; })
      .addCase(loadOrders.fulfilled, (state, action) => { state.ordersLoading = false; state.orders = action.payload; })
      .addCase(loadOrders.rejected, state => { state.ordersLoading = false; })

      .addCase(loadSubscriptions.pending, state => { state.subsLoading = true; })
      .addCase(loadSubscriptions.fulfilled, (state, action) => { state.subsLoading = false; state.subscriptions = action.payload; })
      .addCase(loadSubscriptions.rejected, state => { state.subsLoading = false; })

      .addCase(placeOrder.pending, state => { state.orderBusy = true; state.error = null; })
      .addCase(placeOrder.fulfilled, state => { state.orderBusy = false; })
      .addCase(placeOrder.rejected, (state, action) => { state.orderBusy = false; state.error = action.payload; })

      .addCase(subscribe.pending, state => { state.subscribeBusy = true; state.error = null; })
      .addCase(subscribe.fulfilled, state => { state.subscribeBusy = false; })
      .addCase(subscribe.rejected, (state, action) => { state.subscribeBusy = false; state.error = action.payload; });
  },
});

export default mealSlice.reducer;
