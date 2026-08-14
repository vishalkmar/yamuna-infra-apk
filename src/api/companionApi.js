import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

export const companionApi = {
  listCheckins: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getCheckins();
    const { data } = await api.get('/companion/checkins');
    return data.data;
  },
  addCheckin: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.addCheckin(payload);
    const { data } = await api.post('/companion/checkin', payload);
    return data.data;
  },
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
    const { data } = await api.post('/ai/chat', { message });
    return data.data;
  },
  dailyContent: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getDailyContent();
    const { data } = await api.get('/spiritual/daily-content');
    return data.data;
  },
};
