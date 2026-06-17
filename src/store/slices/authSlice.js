import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../api/authApi';

// Login now uses EMAIL OTP (Task 4). The thunk arg is the email address.
export const sendOtp = createAsyncThunk('auth/sendOtp', async (email, { rejectWithValue }) => {
  try {
    return await authApi.sendEmailOtp(email);
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || err?.message || 'Could not send OTP email');
  }
});

export const verifyOtp = createAsyncThunk('auth/verifyOtp', async ({ email, otp }, { rejectWithValue }) => {
  try {
    return await authApi.verifyEmailOtp(email, otp);
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'OTP verification failed');
  }
});

const initialState = {
  token: null,
  user: null,
  mobile: null,
  email: null,
  isLoggedIn: false,
  loading: false,
  otpSent: false,
  otpAttempts: 0,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: state => {
      state.token = null;
      state.user = null;
      state.isLoggedIn = false;
      state.otpSent = false;
      state.mobile = null;
      state.otpAttempts = 0;
    },
    setMobile: (state, action) => {
      state.mobile = action.payload;
    },
    setEmail: (state, action) => {
      state.email = action.payload;
    },
    resetOtpFlow: state => {
      state.otpSent = false;
      state.otpAttempts = 0;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(sendOtp.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.otpSent = true;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message || 'Failed to send OTP';
      })
      .addCase(verifyOtp.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isLoggedIn = true;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'OTP verification failed';
        state.otpAttempts += 1;
      });
  },
});

export const { logout, setMobile, setEmail, resetOtpFlow } = authSlice.actions;
export default authSlice.reducer;
