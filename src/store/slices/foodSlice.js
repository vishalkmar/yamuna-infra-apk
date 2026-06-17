import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { foodApi } from '../../api/foodApi';

export const loadFoodCategories = createAsyncThunk('food/categories', async () => foodApi.categories());
export const loadFoodItems = createAsyncThunk('food/items', async categoryCode => foodApi.items(categoryCode));
export const loadFoodOrders = createAsyncThunk('food/orders', async () => foodApi.orders());

export const placeFoodOrder = createAsyncThunk(
  'food/placeOrder',
  async (payload, { rejectWithValue }) => {
    try { return await foodApi.placeOrder(payload); }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'Could not place order'); }
  },
);

const initialState = {
  categories: [],
  categoriesLoading: false,
  items: [],
  itemsLoading: false,
  cart: [], // [{ itemId, name, price, image, qty }]
  orders: [],
  ordersLoading: false,
  placing: false,
  error: null,
};

const foodSlice = createSlice({
  name: 'food',
  initialState,
  reducers: {
    addToCart(state, action) {
      const it = action.payload;
      const found = state.cart.find(c => c.itemId === it.id);
      if (found) found.qty += 1;
      else state.cart.push({ itemId: it.id, name: it.name, price: it.price, image: it.image, qty: 1 });
    },
    incItem(state, action) {
      const c = state.cart.find(x => x.itemId === action.payload);
      if (c) c.qty += 1;
    },
    decItem(state, action) {
      const c = state.cart.find(x => x.itemId === action.payload);
      if (c) {
        c.qty -= 1;
        if (c.qty <= 0) state.cart = state.cart.filter(x => x.itemId !== action.payload);
      }
    },
    removeItem(state, action) {
      state.cart = state.cart.filter(x => x.itemId !== action.payload);
    },
    clearCart(state) { state.cart = []; },
  },
  extraReducers: builder => {
    builder
      .addCase(loadFoodCategories.pending, state => { state.categoriesLoading = true; })
      .addCase(loadFoodCategories.fulfilled, (state, action) => { state.categoriesLoading = false; state.categories = action.payload; })
      .addCase(loadFoodCategories.rejected, state => { state.categoriesLoading = false; })

      .addCase(loadFoodItems.pending, state => { state.itemsLoading = true; })
      .addCase(loadFoodItems.fulfilled, (state, action) => { state.itemsLoading = false; state.items = action.payload; })
      .addCase(loadFoodItems.rejected, state => { state.itemsLoading = false; })

      .addCase(loadFoodOrders.pending, state => { state.ordersLoading = true; })
      .addCase(loadFoodOrders.fulfilled, (state, action) => { state.ordersLoading = false; state.orders = action.payload; })
      .addCase(loadFoodOrders.rejected, state => { state.ordersLoading = false; })

      .addCase(placeFoodOrder.pending, state => { state.placing = true; state.error = null; })
      .addCase(placeFoodOrder.fulfilled, state => { state.placing = false; state.cart = []; })
      .addCase(placeFoodOrder.rejected, (state, action) => { state.placing = false; state.error = action.payload; });
  },
});

export const { addToCart, incItem, decItem, removeItem, clearCart } = foodSlice.actions;
export default foodSlice.reducer;
