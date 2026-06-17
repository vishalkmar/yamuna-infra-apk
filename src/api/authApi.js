import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

export const authApi = {
  sendOtp: async mobile => {
    if (ENV.USE_MOCK_API) return mockApi.sendOtp(mobile);
    const { data } = await api.post('/auth/send-otp', { mobile });
    return data.data;
  },
  verifyOtp: async (mobile, otp) => {
    if (ENV.USE_MOCK_API) return mockApi.verifyOtp(mobile, otp);
    const { data } = await api.post('/auth/verify-otp', { mobile, otp });
    return data.data;
  },
  // Email OTP (used when running against the real backend — Task 4).
  sendEmailOtp: async email => {
    if (ENV.USE_MOCK_API) return mockApi.sendOtp(email);
    const { data } = await api.post('/auth/email/send-otp', { email });
    return data.data;
  },
  verifyEmailOtp: async (email, otp) => {
    if (ENV.USE_MOCK_API) return mockApi.verifyOtp(email, otp);
    const { data } = await api.post('/auth/email/verify-otp', { email, otp });
    return data.data;
  },
  me: async () => {
    if (ENV.USE_MOCK_API) return { user: null };
    const { data } = await api.get('/auth/me');
    return data.data;
  },
};
