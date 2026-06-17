import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

export const wellnessApi = {
  listTherapies: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getTherapies();
    const { data } = await api.get('/wellness/therapies');
    return data.data;
  },

  getSlots: async date => {
    if (ENV.USE_MOCK_API) return mockApi.getWellnessSlots(date);
    const { data } = await api.get(`/wellness/slots/${date}`);
    return data.data;
  },

  book: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.bookWellness(payload);
    const { data } = await api.post('/wellness/book', payload);
    return data.data;
  },

  listBookings: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getWellnessBookings();
    const { data } = await api.get('/wellness/bookings');
    return data.data;
  },
};
