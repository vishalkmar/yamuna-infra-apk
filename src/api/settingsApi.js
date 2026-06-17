import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

export const settingsApi = {
  getSettings: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getSettings();
    const { data } = await api.get('/settings');
    return data.data;
  },
  updateSettings: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.updateSettings(payload);
    const { data } = await api.put('/settings', payload);
    return data.data;
  },
};
