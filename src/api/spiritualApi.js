import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

export const spiritualApi = {
  listTemples: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getTemples();
    const { data } = await api.get('/temples/list');
    return data.data;
  },

  getTemple: async templeId => {
    if (ENV.USE_MOCK_API) return mockApi.getTemple(templeId);
    const { data } = await api.get(`/temples/${templeId}`);
    return data.data;
  },

  listFestivals: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getFestivals();
    const { data } = await api.get('/temples/festivals');
    return data.data;
  },

  bookDarshan: async (payload, isVip = false) => {
    if (ENV.USE_MOCK_API) return mockApi.bookDarshan(payload, isVip);
    const { data } = await api.post(isVip ? '/darshan/vip-book' : '/darshan/book', payload);
    return data.data;
  },

  listMyDarshan: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getMyDarshan();
    const { data } = await api.get('/darshan/mine');
    return data.data;
  },
};
