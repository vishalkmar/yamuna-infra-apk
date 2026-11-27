import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

// The live API uses the backend's field names (imageUrl, isVeg, string
// decimals); the screens were written against the mock shape (image, veg,
// numbers). Normalise once here so images, veg dots and prices render right.
const normCategory = c => ({
  ...c,
  image: c.image ?? c.imageUrl ?? null,
  itemCount: c.itemCount != null ? Number(c.itemCount) : null,
});
const normItem = i => ({
  ...i,
  image: i.image ?? i.imageUrl ?? null,
  veg: i.veg != null ? !!i.veg : Number(i.isVeg) === 1,
  price: Number(i.price) || 0,
  rating: i.rating != null ? Number(i.rating).toFixed(1) : null,
  soldOut: !!Number(i.soldOut || 0),
});

export const foodApi = {
  categories: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getFoodCategories();
    const { data } = await api.get('/food/categories');
    return (data.data || []).map(normCategory);
  },
  items: async categoryCode => {
    if (ENV.USE_MOCK_API) return mockApi.getFoodItems(categoryCode);
    const { data } = await api.get(`/food/items?category=${encodeURIComponent(categoryCode || '')}`);
    return (data.data || []).map(normItem);
  },
  placeOrder: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.placeFoodOrder(payload);
    const { data } = await api.post('/food/order', payload);
    return data.data;
  },
  orders: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getFoodOrders();
    const { data } = await api.get('/food/orders');
    return data.data;
  },
};
