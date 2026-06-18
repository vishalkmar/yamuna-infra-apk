import api from './client';

// Per-property construction tracker (admin-managed). All read-only for residents.
export const constructionApi = {
  myProperties: async () => {
    const { data } = await api.get('/construction/properties');
    return data.data;
  },
  getProgress: async propertyId => {
    const { data } = await api.get(`/construction/property/${propertyId}/progress`);
    return data.data;
  },
  getUpdates: async (propertyId, limit = 20) => {
    const { data } = await api.get(`/construction/property/${propertyId}/updates?limit=${limit}`);
    return data.data;
  },
  getStep: async (propertyId, stepId) => {
    const { data } = await api.get(`/construction/property/${propertyId}/step/${stepId}`);
    return data.data;
  },
};
