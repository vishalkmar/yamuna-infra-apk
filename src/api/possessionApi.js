import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

export const possessionApi = {
  getStatus: async bookingId => {
    if (ENV.USE_MOCK_API) return mockApi.getPossessionStatus(bookingId);
    const { data } = await api.get(`/possession/${bookingId}/status`);
    return data.data;
  },

  bookAppointment: async (bookingId, payload) => {
    if (ENV.USE_MOCK_API) return mockApi.bookPossessionAppointment(payload);
    const { data } = await api.post(`/possession/${bookingId}/appointment`, payload);
    return data.data;
  },
};
