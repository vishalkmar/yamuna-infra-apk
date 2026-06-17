import { createSlice } from '@reduxjs/toolkit';

// Lightweight initial slices for the remaining modules. Each exposes a generic
// setData reducer until the real flows are implemented.

const makeSimpleSlice = (name, initial = {}) =>
  createSlice({
    name,
    initialState: { ...initial, loading: false, error: null },
    reducers: {
      setData(state, action) {
        Object.assign(state, action.payload);
      },
    },
  });

// projectSlice → ./projectSlice.js (M4); possessionSlice → ./possessionSlice.js (M7)
// servicesSlice → ./servicesSlice.js (M10)
// healthcareSlice → ./healthcareSlice.js (M15)
// templeSlice → ./templeSlice.js (M18-20)
// communitySlice → ./communitySlice.js (M21-23)
// rewardsSlice → ./rewardsSlice.js (M24-25); companionSlice → ./companionSlice.js (M26)
// sosSlice → ./sosSlice.js (M14)
export const notificationsSlice = makeSimpleSlice('notifications', { unreadCount: 0, list: [], preferences: {} });
