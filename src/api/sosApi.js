import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

export const sosApi = {
  getContacts: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getSosContacts();
    const { data } = await api.get('/sos/contacts');
    return data.data;
  },

  saveContacts: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.saveSosContacts(payload);
    const { data } = await api.post('/sos/contacts', payload);
    return data.data;
  },

  activate: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.activateSos(payload);
    const { data } = await api.post('/sos/activate', payload);
    return data.data;
  },

  dispatch: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.dispatchSos(payload);
    const { data } = await api.post('/sos/dispatch', payload);
    return data.data;
  },

  track: async requestId => {
    if (ENV.USE_MOCK_API) return mockApi.trackAmbulance(requestId);
    const { data } = await api.get(`/sos/ambulance/track/${requestId}`);
    return data.data;
  },
};
