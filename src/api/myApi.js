import api from './client';
import { ENV } from '../constants/env';

// The resident's own bookings (with payment + receipt) and app transactions.
export const myApi = {
  bookings: async () => (await api.get('/my/bookings', { timeout: 45000 })).data.data,
  transactions: async () => (await api.get('/my/transactions', { timeout: 45000 })).data.data,
  // Absolute, directly downloadable receipt link (token in the query because
  // the phone's downloader cannot send an Authorization header).
  receiptLink: (url, token) => {
    if (!url) return null;
    if (/^https?:/.test(url)) return url;
    const origin = ENV.API_BASE_URL.replace(/\/api\/?$/, '');
    return `${origin}${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token || '')}`;
  },
};
