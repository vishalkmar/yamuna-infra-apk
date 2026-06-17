import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

export const transportApi = {
  places: async query => {
    if (ENV.USE_MOCK_API) return mockApi.getTransportPlaces(query);
    const { data } = await api.get(`/transport/places?q=${encodeURIComponent(query || '')}`);
    return data.data;
  },
  estimate: async ({ pickup, drop }) => {
    if (ENV.USE_MOCK_API) return mockApi.getVehicleEstimates({ pickup, drop });
    const { data } = await api.post('/transport/estimate', { pickup, drop });
    return data.data;
  },
  book: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.bookRide(payload);
    const { data } = await api.post('/transport/book', payload);
    return data.data;
  },
  myRides: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getMyRides();
    const { data } = await api.get('/transport/rides');
    return data.data;
  },
};
