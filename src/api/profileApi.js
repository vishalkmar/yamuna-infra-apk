import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

export const profileApi = {
  getProfile: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getProfile();
    const { data } = await api.get('/profile');
    return data.data;
  },
  updatePersonal: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.updatePersonal(payload);
    const { data } = await api.put('/profile/personal', payload);
    return data.data;
  },
  updatePreferences: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.updatePreferences(payload);
    const { data } = await api.put('/profile/preferences', payload);
    return data.data;
  },
  addFamilyMember: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.addFamilyMember(payload);
    const { data } = await api.post('/profile/family', payload);
    return data.data;
  },
  updateFamilyMember: async (id, payload) => {
    if (ENV.USE_MOCK_API) return mockApi.updateFamilyMember(id, payload);
    const { data } = await api.put(`/profile/family/${id}`, payload);
    return data.data;
  },
  removeFamilyMember: async id => {
    if (ENV.USE_MOCK_API) return mockApi.removeFamilyMember(id);
    const { data } = await api.delete(`/profile/family/${id}`);
    return data.data;
  },
  submitKyc: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.submitKyc(payload);
    const { data } = await api.post('/profile/kyc', payload);
    return data.data;
  },
};
