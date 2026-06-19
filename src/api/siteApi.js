import api from './client';

// Admin-managed site overview (global — same for every resident).
export const siteApi = {
  getOverview: async () => {
    const { data } = await api.get('/site/overview');
    return data.data; // { config, images, updates }
  },
};
