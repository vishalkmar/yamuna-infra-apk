import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

export const documentApi = {
  list: async (bookingId, { search, category, from, to, archived } = {}) => {
    if (ENV.USE_MOCK_API) {
      const all = await mockApi.getDocuments(bookingId);
      return all
        .filter(d => !category || category === 'all' || d.category === category)
        .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()));
    }
    const qs = new URLSearchParams();
    if (search)   qs.set('search', search);
    if (category) qs.set('category', category);
    if (from)     qs.set('from', from);
    if (to)       qs.set('to', to);
    if (archived) qs.set('archived', '1');
    const s = qs.toString();
    const { data } = await api.get(`/booking/${bookingId}/documents${s ? '?' + s : ''}`);
    return data.data;
  },

  categories: async bookingId => {
    if (ENV.USE_MOCK_API) {
      return {
        total: 12, pendingSign: 1,
        buckets: [
          { category: 'agreement', total: 3, pendingSign: 1, active: 3 },
          { category: 'invoice',   total: 3, pendingSign: 0, active: 3 },
          { category: 'receipt',   total: 2, pendingSign: 0, active: 2 },
          { category: 'noc',       total: 2, pendingSign: 0, active: 2 },
          { category: 'tax',       total: 2, pendingSign: 0, active: 2 },
        ],
      };
    }
    const { data } = await api.get(`/booking/${bookingId}/documents-categories`);
    return data.data;
  },

  getDownloadUrl: async (bookingId, docId) => {
    if (ENV.USE_MOCK_API) {
      return { id: docId, name: 'Document.pdf', url: 'https://example.invalid/doc.pdf', expiresInSeconds: 300 };
    }
    const { data } = await api.get(`/booking/${bookingId}/documents/${docId}/download`);
    return data.data;
  },

  bulkDownload: async (bookingId, ids) => {
    if (ENV.USE_MOCK_API) {
      return {
        requested: ids.length,
        found: ids.length,
        items: ids.map(id => ({ id, name: `Doc ${id}.pdf`, url: 'https://example.invalid/doc.pdf' })),
      };
    }
    const { data } = await api.post(`/booking/${bookingId}/documents/bulk-download`, { ids });
    return data.data;
  },

  logView: async (bookingId, docId, source = 'detail') => {
    if (ENV.USE_MOCK_API) return null;
    const { data } = await api.post(`/booking/${bookingId}/documents/${docId}/view`, { source });
    return data.data;
  },

  logShare: async (bookingId, ids, channel, recipient) => {
    if (ENV.USE_MOCK_API) return null;
    const { data } = await api.post(`/booking/${bookingId}/documents/share-event`, { ids, channel, recipient });
    return data.data;
  },
};
