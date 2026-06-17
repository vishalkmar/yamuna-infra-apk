import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

export const healthcareApi = {
  listDoctors: async ({ specialty } = {}) => {
    if (ENV.USE_MOCK_API) return mockApi.getDoctors(specialty);
    const qs = specialty ? `?specialty=${encodeURIComponent(specialty)}` : '';
    const { data } = await api.get(`/healthcare/doctors${qs}`);
    return data.data;
  },

  getSlots: async (doctorId, date) => {
    if (ENV.USE_MOCK_API) return mockApi.getHealthcareSlots(doctorId, date);
    const { data } = await api.get(`/healthcare/slots/${doctorId}/${date}`);
    return data.data;
  },

  book: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.bookAppointment(payload);
    const { data } = await api.post('/healthcare/appointment', payload);
    return data.data;
  },

  listMine: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getMyAppointments();
    const { data } = await api.get('/healthcare/appointments');
    return data.data;
  },

  orderMedicine: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.orderMedicine(payload);
    const { data } = await api.post('/healthcare/medicine-order', payload);
    return data.data;
  },
};
