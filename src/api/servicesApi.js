import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

export const servicesApi = {
  listCategories: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getServiceCategories();
    const { data } = await api.get('/services/categories');
    return data.data;
  },

  listProviders: async ({ category, genderPref } = {}) => {
    if (ENV.USE_MOCK_API) return mockApi.getServiceProviders(category, genderPref);
    const qs = new URLSearchParams();
    if (category) qs.set('category', category);
    if (genderPref) qs.set('genderPref', genderPref);
    const { data } = await api.get(`/services/providers?${qs.toString()}`);
    return data.data;
  },

  book: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.bookService(payload);
    const { data } = await api.post('/services/book', payload);
    return data.data;
  },

  listMine: async ({ category } = {}) => {
    if (ENV.USE_MOCK_API) return mockApi.getServiceBookings(category);
    const qs = category ? `?category=${category}` : '';
    const { data } = await api.get(`/services/bookings${qs}`);
    return data.data;
  },
};
