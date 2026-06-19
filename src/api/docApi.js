import api from './client';

// Resident documents (booking dockets, invoices) uploaded by the office.
export const docApi = {
  list: async kind => {
    const { data } = await api.get(`/documents${kind ? `?kind=${encodeURIComponent(kind)}` : ''}`);
    return data.data; // [{ id, title, url, kind, createdAt }]
  },
};
