import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

export const snagApi = {
  list: async (bookingId, { status } = {}) => {
    if (ENV.USE_MOCK_API) return mockApi.getSnags(status);
    const qs = status ? `?status=${status}` : '';
    const { data } = await api.get(`/snag/${bookingId}/list${qs}`);
    return data.data;
  },

  report: async (bookingId, payload) => {
    if (ENV.USE_MOCK_API) return mockApi.reportSnag(payload);
    const { data } = await api.post(`/snag/${bookingId}/report`, payload);
    return data.data;
  },

  signoff: async (bookingId, snagId) => {
    if (ENV.USE_MOCK_API) return mockApi.signoffSnag(snagId);
    const { data } = await api.patch(`/snag/${bookingId}/${snagId}/signoff`);
    return data.data;
  },
};
