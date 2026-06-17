import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

export const projectApi = {
  getProgress: async projectId => {
    if (ENV.USE_MOCK_API) return mockApi.getProjectProgress(projectId);
    const { data } = await api.get(`/project/${projectId}/progress`);
    return data.data;
  },

  getUpdates: async (projectId, limit = 20) => {
    if (ENV.USE_MOCK_API) return mockApi.getProjectUpdates(projectId, limit);
    const { data } = await api.get(`/project/${projectId}/updates?limit=${limit}`);
    return data.data;
  },

  getMilestone: async (projectId, milestoneId) => {
    if (ENV.USE_MOCK_API) return mockApi.getMilestone(projectId, milestoneId);
    const { data } = await api.get(`/project/${projectId}/milestone/${milestoneId}`);
    return data.data;
  },

  setSubscription: async (projectId, milestoneId, { enabled, channels }) => {
    if (ENV.USE_MOCK_API) {
      return { milestoneId, enabled, channels: channels || ['push'] };
    }
    const { data } = await api.put(
      `/project/${projectId}/milestone/${milestoneId}/subscription`,
      { enabled, channels },
    );
    return data.data;
  },
};
