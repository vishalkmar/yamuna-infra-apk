import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authReducer, { logout } from './slices/authSlice';
import bookingReducer from './slices/bookingSlice';
import paymentReducer from './slices/paymentSlice';
import documentsReducer from './slices/documentSlice';
import projectReducer from './slices/projectSlice';
import siteVisitReducer from './slices/siteVisitSlice';
import supportReducer from './slices/supportSlice';
import possessionReducer from './slices/possessionSlice';
import snagReducer from './slices/snagSlice';
import moveInReducer from './slices/moveInSlice';
import servicesReducer from './slices/servicesSlice';
import mealReducer from './slices/mealSlice';
import sosReducer from './slices/sosSlice';
import healthcareReducer from './slices/healthcareSlice';
import mobilityReducer from './slices/mobilitySlice';
import wellnessReducer from './slices/wellnessSlice';
import templeReducer from './slices/templeSlice';
import communityReducer from './slices/communitySlice';
import rewardsReducer from './slices/rewardsSlice';
import companionReducer from './slices/companionSlice';
import profileReducer from './slices/profileSlice';
import settingsReducer from './slices/settingsSlice';
import transportReducer from './slices/transportSlice';
import foodReducer from './slices/foodSlice';
import {
  notificationsSlice,
} from './slices/miscSlices';
import { registerStore } from '../api/client';

const appReducer = combineReducers({
  auth: authReducer,
  booking: bookingReducer,
  payment: paymentReducer,
  documents: documentsReducer,
  project: projectReducer,
  siteVisit: siteVisitReducer,
  support: supportReducer,
  possession: possessionReducer,
  snag: snagReducer,
  movein: moveInReducer,
  services: servicesReducer,
  meal: mealReducer,
  healthcare: healthcareReducer,
  mobility: mobilityReducer,
  wellness: wellnessReducer,
  temple: templeReducer,
  community: communityReducer,
  rewards: rewardsReducer,
  companion: companionReducer,
  profile: profileReducer,
  settings: settingsReducer,
  transport: transportReducer,
  food: foodReducer,
  sos: sosReducer,
  notifications: notificationsSlice.reducer,
});

// Logging out wipes every slice, not just `auth`. Previously only the auth
// slice was cleared, so signing in as a different account on the same app run
// inherited the last user's property, payment and document state — which both
// leaked their data on screen and pinned API calls to a property the new user
// does not own (every such call then 404s). `_persist` is carried over so
// redux-persist keeps working across the reset.
const rootReducer = (state, action) => {
  if (action.type === logout.type) {
    return appReducer(state ? { _persist: state._persist } : undefined, action);
  }
  return appReducer(state, action);
};

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefault =>
    getDefault({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/PURGE'],
      },
    }),
});

export const persistor = persistStore(store);

registerStore(store, logout);
