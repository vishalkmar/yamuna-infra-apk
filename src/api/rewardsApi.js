import api from './client';
import { ENV } from '../constants/env';
import { mockApi } from './mock';

export const rewardsApi = {
  getBalance: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getRewardBalance();
    const { data } = await api.get('/rewards/balance');
    return data.data;
  },
  listOffers: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getRewardOffers();
    const { data } = await api.get('/rewards/offers');
    return data.data;
  },
  redeem: async offerId => {
    if (ENV.USE_MOCK_API) return mockApi.redeemReward(offerId);
    const { data } = await api.post('/rewards/redeem', { offerId });
    return data.data;
  },
  listInvestments: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getInvestments();
    const { data } = await api.get('/investments/list');
    return data.data;
  },
  submitReferral: async payload => {
    if (ENV.USE_MOCK_API) return mockApi.submitReferral(payload);
    const { data } = await api.post('/rewards/referral', payload);
    return data.data;
  },
  listReferrals: async () => {
    if (ENV.USE_MOCK_API) return mockApi.getReferrals();
    const { data } = await api.get('/rewards/referrals');
    return data.data;
  },
};
