import api from './client';

// SOS is admin-managed now: residents see the dispatch number + emergency
// services, and can raise a live alert (press-and-hold) that reception sees.
export const sosApi = {
  getContacts: async () => {
    const { data } = await api.get('/sos/contacts');
    return data.data; // { sosPhone, services: [{id,name,phone}] }
  },
  activate: async payload => {
    const { data } = await api.post('/sos/activate', payload || {});
    return data.data;
  },
};
