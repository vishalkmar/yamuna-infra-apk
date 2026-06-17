import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

export const bookingApi = {
  getDetails: async bookingId => {
    if (ENV.USE_MOCK_API) return mockApi.getBookingDetails(bookingId);
    const { data } = await api.get(`/booking/${bookingId}`);
    return data.data;
  },

  listMine: async () => {
    if (ENV.USE_MOCK_API) {
      return [{ bookingId: 'BK-2024-00421', unitNumber: 'T2-B-1204', status: 'active' }];
    }
    const { data } = await api.get('/booking/mine');
    return data.data;
  },

  getDocuments: async bookingId => {
    if (ENV.USE_MOCK_API) return mockApi.getDocuments(bookingId);
    const { data } = await api.get(`/booking/${bookingId}/documents`);
    return data.data;
  },

  getDocument: async (bookingId, docId) => {
    if (ENV.USE_MOCK_API) return mockApi.getDocument?.(bookingId, docId) || null;
    const { data } = await api.get(`/booking/${bookingId}/documents/${docId}`);
    return data.data;
  },

  getDocumentDownloadUrl: async (bookingId, docId) => {
    if (ENV.USE_MOCK_API) {
      return { id: docId, name: 'Document.pdf', url: 'https://example.invalid/doc.pdf', expiresInSeconds: 300 };
    }
    const { data } = await api.get(`/booking/${bookingId}/documents/${docId}/download`);
    return data.data;
  },

  initiateEsignature: async (bookingId, docId) => {
    if (ENV.USE_MOCK_API) {
      return {
        envelopeId: `MOCK-ENV-${docId}-${Date.now()}`,
        signingUrl: 'https://example.invalid/sign?mock=1',
      };
    }
    const { data } = await api.post(
      `/booking/${bookingId}/documents/${docId}/esignature/initiate`,
    );
    return data.data;
  },

  completeEsignature: async (bookingId, docId, payload) => {
    if (ENV.USE_MOCK_API) {
      return {
        id: docId,
        name: 'Document.pdf',
        signedAt: new Date().toISOString(),
        status: payload?.status || 'signed',
      };
    }
    const { data } = await api.patch(
      `/booking/${bookingId}/documents/${docId}/esignature`,
      payload,
    );
    return data.data;
  },

  getEsignatureHistory: async (bookingId, docId) => {
    if (ENV.USE_MOCK_API) return [];
    const { data } = await api.get(
      `/booking/${bookingId}/documents/${docId}/esignature/history`,
    );
    return data.data;
  },

  getWelcomeKit: async bookingId => {
    if (ENV.USE_MOCK_API) return mockApi.getWelcomeKit?.(bookingId) || { project: null, items: [] };
    const { data } = await api.get(`/booking/${bookingId}/welcome-kit`);
    return data.data;
  },
};
