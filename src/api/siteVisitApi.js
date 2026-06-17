import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

export const siteVisitApi = {
  getSlots: async (projectId, date) => {
    if (ENV.USE_MOCK_API) return mockApi.getSiteVisitSlots(projectId, date);
    const { data } = await api.get(`/site-visit/slots?projectId=${projectId}&date=${date}`);
    return data.data;
  },

  getVirtualTours: async projectId => {
    if (ENV.USE_MOCK_API) return mockApi.getVirtualTours(projectId);
    const { data } = await api.get(`/site-visit/virtual-tours/${projectId}`);
    return data.data;
  },

  listMine: async ({ status } = {}) => {
    if (ENV.USE_MOCK_API) return mockApi.getMySiteVisits(status);
    const qs = status ? `?status=${status}` : '';
    const { data } = await api.get(`/site-visit/mine${qs}`);
    return data.data;
  },

  book: async payload => {
    if (ENV.USE_MOCK_API) {
      return {
        id: Math.floor(Math.random() * 1000),
        confirmationCode: `SV-MOCK-${Date.now().toString().slice(-5)}`,
        visitDate: payload.visitDate,
        visitTime: payload.visitTime,
      };
    }
    const { data } = await api.post('/site-visit/book', payload);
    return data.data;
  },

  cancel: async (visitId, reason) => {
    if (ENV.USE_MOCK_API) return { id: visitId, status: 'cancelled' };
    const { data } = await api.patch(`/site-visit/${visitId}/cancel`, { reason });
    return data.data;
  },

  reschedule: async (visitId, visitDate, visitTime) => {
    if (ENV.USE_MOCK_API) {
      return { id: visitId, visitDate, visitTime, status: 'rescheduled' };
    }
    const { data } = await api.patch(`/site-visit/${visitId}/reschedule`, { visitDate, visitTime });
    return data.data;
  },
};
