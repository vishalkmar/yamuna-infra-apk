import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

export const supportApi = {
  listTickets: async ({ status } = {}) => {
    if (ENV.USE_MOCK_API) return mockApi.getSupportTickets(status);
    const qs = status ? `?status=${status}` : '';
    const { data } = await api.get(`/support/tickets${qs}`);
    return data.data;
  },

  getTicket: async ticketId => {
    if (ENV.USE_MOCK_API) return mockApi.getSupportTicket(ticketId);
    const { data } = await api.get(`/support/tickets/${ticketId}`);
    return data.data;
  },

  createTicket: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.createSupportTicket(payload);
    const { data } = await api.post('/support/tickets', payload);
    return data.data;
  },

  reply: async (ticketId, body) => {
    if (ENV.USE_MOCK_API) return mockApi.replySupportTicket(ticketId, body);
    const { data } = await api.post(`/support/tickets/${ticketId}/reply`, { body });
    return data.data;
  },

  rate: async (ticketId, rating) => {
    if (ENV.USE_MOCK_API) return mockApi.rateSupportTicket(ticketId, rating);
    const { data } = await api.patch(`/support/tickets/${ticketId}/rate`, { rating });
    return data.data;
  },

  bookAppointment: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.bookSupportAppointment(payload);
    const { data } = await api.post('/support/appointments', payload);
    return data.data;
  },
};
