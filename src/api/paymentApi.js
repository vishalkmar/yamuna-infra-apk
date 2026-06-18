import api from './client';
import { ENV } from '../constants/env';

// Per-property payment plan (admin-managed). Residents can also pay online
// (Cashfree); admin can mark paid at the counter — both reflect here.
export const paymentApi = {
  myProperties: async () => {
    const { data } = await api.get('/payment-plan/my');
    return data.data;
  },

  getSchedule: async propertyId => {
    const { data } = await api.get(`/payment-plan/property/${propertyId}/schedule`);
    return data.data;
  },

  getHistory: async (propertyId, { search, method } = {}) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (method) params.set('method', method);
    const qs = params.toString();
    const { data } = await api.get(`/payment-plan/property/${propertyId}/history${qs ? '?' + qs : ''}`);
    return data.data;
  },

  getLedger: async propertyId => {
    const { data } = await api.get(`/payment-plan/property/${propertyId}/ledger`);
    return data.data;
  },

  // Online pay — create a Cashfree order for one installment.
  initiate: async installmentId => {
    const { data } = await api.post(`/payment-plan/installment/${installmentId}/initiate`, {});
    return data.data;
  },

  verify: async orderId => {
    const { data } = await api.post('/payment-plan/verify', { orderId });
    return data.data;
  },

  // Authorized PDF link (token in query so the device browser can open it).
  statementUrl: (propertyId, token) =>
    `${ENV.API_BASE_URL}/payment-plan/property/${propertyId}/statement.pdf?token=${encodeURIComponent(token || '')}`,
};
