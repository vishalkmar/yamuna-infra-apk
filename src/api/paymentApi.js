import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

export const paymentApi = {
  getSchedule: async bookingId => {
    if (ENV.USE_MOCK_API) return mockApi.getPaymentSchedule(bookingId);
    const { data } = await api.get(`/payment/schedule/${bookingId}`);
    return data.data;
  },

  getHistory: async (bookingId, { search, method, limit } = {}) => {
    if (ENV.USE_MOCK_API) {
      const all = await mockApi.getPaymentHistory(bookingId);
      return all
        .filter(p => !method || p.method === method)
        .filter(p => !search || (p.txnId + p.remarks || '').toLowerCase().includes(search.toLowerCase()));
    }
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (method) params.set('method', method);
    if (limit)  params.set('limit', String(limit));
    const qs = params.toString();
    const { data } = await api.get(`/payment/history/${bookingId}${qs ? '?' + qs : ''}`);
    return data.data;
  },

  getLedger: async bookingId => {
    if (ENV.USE_MOCK_API) return mockApi.getLedger?.(bookingId) || null;
    const { data } = await api.get(`/payment/ledger/${bookingId}`);
    return data.data;
  },

  initiate: async payload => {
    if (ENV.USE_MOCK_API) {
      return {
        orderId: 'MOCK-' + Date.now(),
        paymentLink: 'https://example.invalid/checkout',
        paymentSessionId: 'mock-session',
        amount: payload.amount,
        currency: 'INR',
        environment: 'sandbox',
      };
    }
    const { data } = await api.post('/payment/initiate', payload);
    return data.data;
  },

  verify: async orderId => {
    if (ENV.USE_MOCK_API) {
      return { orderId, status: 'paid', paymentId: 99, receiptCode: 'RCPT-MOCK' };
    }
    const { data } = await api.post('/payment/verify', { orderId });
    return data.data;
  },
};
