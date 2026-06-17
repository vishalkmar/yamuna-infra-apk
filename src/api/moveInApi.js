import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

export const moveInApi = {
  // Shifting
  listShifting: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getShiftingBookings();
    const { data } = await api.get('/movein/shifting');
    return data.data;
  },
  bookShifting: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.bookShifting(payload);
    const { data } = await api.post('/movein/shifting', payload);
    return data.data;
  },

  // Utilities
  listUtilities: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getUtilityRequests();
    const { data } = await api.get('/movein/utilities');
    return data.data;
  },
  requestUtility: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.requestUtility(payload);
    const { data } = await api.post('/movein/utility', payload);
    return data.data;
  },

  // Interiors
  listInteriorPartners: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getInteriorPartners();
    const { data } = await api.get('/movein/interior-partners');
    return data.data;
  },
  requestReferral: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.requestInteriorReferral(payload);
    const { data } = await api.post('/movein/interior-referral', payload);
    return data.data;
  },
};
