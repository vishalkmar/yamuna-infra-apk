import axios from 'axios';
import { ENV } from '../constants/env';
import { showToast } from '../utils/toastConfig';

let getStoreRef = null;
let logoutActionRef = null;

export function registerStore(store, logoutAction) {
  getStoreRef = () => store;
  logoutActionRef = logoutAction;
}

const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.API_TIMEOUT_MS,
});

api.interceptors.request.use(config => {
  if (getStoreRef) {
    const token = getStoreRef().getState()?.auth?.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    const status = error?.response?.status;
    if (status === 401) {
      if (getStoreRef && logoutActionRef) getStoreRef().dispatch(logoutActionRef());
      showToast('error', 'Session Expired', 'Please login again.');
    } else if (status === 403) {
      showToast('error', 'Access Denied', 'You do not have permission for this action.');
    } else if (status === 500) {
      showToast('error', 'Server Error', 'Something went wrong. Try again later.');
    } else if (!error.response) {
      showToast('error', 'No Connection', 'Check your internet and retry.');
    }
    return Promise.reject(error);
  },
);

export default api;
