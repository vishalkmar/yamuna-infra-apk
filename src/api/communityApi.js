import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

export const communityApi = {
  // Feed
  listAnnouncements: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getAnnouncements();
    const { data } = await api.get('/community/announcements');
    return data.data;
  },
  listEvents: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getEvents();
    const { data } = await api.get('/community/events');
    return data.data;
  },

  // Visitor
  preAuthorize: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.preAuthorizeGuest(payload);
    const { data } = await api.post('/visitor/pre-authorize', payload);
    return data.data;
  },
  visitorHistory: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getVisitorHistory();
    const { data } = await api.get('/visitor/history');
    return data.data;
  },

  // Amenities
  listAmenities: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getAmenities();
    const { data } = await api.get('/amenities/list');
    return data.data;
  },
  getSlots: async (amenityId, date) => {
    if (ENV.USE_MOCK_API) return mockApi.getAmenitySlots(amenityId, date);
    const { data } = await api.get(`/amenities/${amenityId}/slots?date=${date}`);
    return data.data;
  },
  bookAmenity: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.bookAmenity(payload);
    const { data } = await api.post('/amenities/book', payload);
    return data.data;
  },
  myAmenityBookings: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getMyAmenityBookings();
    const { data } = await api.get('/amenities/mine');
    return data.data;
  },
};
