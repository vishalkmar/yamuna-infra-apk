import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

export const companionApi = {
  listReminders: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getReminders();
    const { data } = await api.get('/companion/reminders');
    return data.data;
  },
  addReminder: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.addReminder(payload);
    const { data } = await api.post('/companion/reminders', payload);
    return data.data;
  },
  updateReminder: async (id, payload) => {
    const { data } = await api.put(`/companion/reminders/${id}`, payload);
    return data.data;
  },
  toggleReminder: async (id, enabled) => {
    const { data } = await api.patch(`/companion/reminders/${id}`, { enabled });
    return data.data;
  },
  deleteReminder: async id => {
    if (ENV.USE_MOCK_API) return mockApi.deleteReminder(id);
    const { data } = await api.delete(`/companion/reminders/${id}`);
    return data.data;
  },
  chatHistory: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getAiChat();
    const { data } = await api.get('/ai/chat');
    return data.data;
  },
  // Chat goes through the backend, which owns the RAG pipeline (admin knowledge
  // base + live app data) and the LLM key. The app never talks to the model
  // provider directly — a shipped key can be extracted from the build.
  sendChat: async message => {
    if (ENV.USE_MOCK_API) return mockApi.sendAiChat(message);
    // The backend may fall through several free-tier models (and Render may be
    // waking from sleep), so give the concierge longer than ordinary calls.
    const { data } = await api.post('/ai/chat', { message }, { timeout: 45000 });
    return data.data;
  },
};
