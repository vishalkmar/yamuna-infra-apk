import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

export const foodApi = {
  categories: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getFoodCategories();
    const { data } = await api.get('/food/categories');
    return data.data;
  },
  items: async categoryCode => {
    if (ENV.USE_MOCK_API) return mockApi.getFoodItems(categoryCode);
    const { data } = await api.get(`/food/items?category=${encodeURIComponent(categoryCode || '')}`);
    return data.data;
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
