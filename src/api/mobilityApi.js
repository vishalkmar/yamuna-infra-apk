import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

export const mobilityApi = {
  listAids: async ({ category } = {}) => {
    if (ENV.USE_MOCK_API) return mockApi.getMobilityAids(category);
    const qs = category ? `?category=${category}` : '';
    const { data } = await api.get(`/mobility/aids${qs}`);
    return data.data;
  },

  book: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.bookMobility(payload);
    const { data } = await api.post('/mobility/book', payload);
    return data.data;
  },

  listBookings: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getMobilityBookings();
    const { data } = await api.get('/mobility/bookings');
    return data.data;
  },
};
