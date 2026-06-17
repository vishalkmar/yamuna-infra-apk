import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

export const mealApi = {
  getMenu: async (date, { dietType } = {}) => {
    if (ENV.USE_MOCK_API) return mockApi.getMealMenu(date, dietType);
    const qs = dietType ? `?dietType=${dietType}` : '';
    const { data } = await api.get(`/meal/menu/${date}${qs}`);
    return data.data;
  },

  placeOrder: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.placeMealOrder(payload);
    const { data } = await api.post('/meal/order', payload);
    return data.data;
  },

  listOrders: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getMealOrders();
    const { data } = await api.get('/meal/orders');
    return data.data;
  },

  subscribe: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.subscribeMeal(payload);
    const { data } = await api.post('/meal/subscribe', payload);
    return data.data;
  },

  listSubscriptions: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getMealSubscriptions();
    const { data } = await api.get('/meal/subscriptions');
    return data.data;
  },
};
