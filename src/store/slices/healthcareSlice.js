import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { healthcareApi } from '../../api/healthcareApi';

export const loadDoctors = createAsyncThunk(
  'healthcare/loadDoctors',
  async ({ specialty } = {}) => healthcareApi.listDoctors({ specialty }),
);

export const loadSlots = createAsyncThunk(
  'healthcare/loadSlots',
  async ({ doctorId, date }) => healthcareApi.getSlots(doctorId, date),
);

export const loadMyAppointments = createAsyncThunk('healthcare/loadMine', async () => healthcareApi.listMine());

export const bookAppointment = createAsyncThunk(
  'healthcare/book',
  async (payload, { rejectWithValue }) => {
    try { return await healthcareApi.book(payload); }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'Could not book appointment'); }
  },
);

export const orderMedicine = createAsyncThunk(
  'healthcare/medicine',
  async (payload, { rejectWithValue }) => {
    try { return await healthcareApi.orderMedicine(payload); }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'Could not order medicine'); }
  },
);

const initialState = {
  doctors: [],
  doctorsLoading: false,
  slots: [],
  slotsLoading: false,
  appointments: [],
  appointmentsLoading: false,
  bookBusy: false,
  medicineBusy: false,
  error: null,
};

const healthcareSlice = createSlice({
  name: 'healthcare',
  initialState,
  reducers: {
    clearSlots(state) { state.slots = []; },
  },
  extraReducers: builder => {
    builder
      .addCase(loadDoctors.pending, state => { state.doctorsLoading = true; })
      .addCase(loadDoctors.fulfilled, (state, action) => { state.doctorsLoading = false; state.doctors = action.payload; })
      .addCase(loadDoctors.rejected, state => { state.doctorsLoading = false; })

      .addCase(loadSlots.pending, state => { state.slotsLoading = true; })
      .addCase(loadSlots.fulfilled, (state, action) => { state.slotsLoading = false; state.slots = action.payload.slots || []; })
      .addCase(loadSlots.rejected, state => { state.slotsLoading = false; })

      .addCase(loadMyAppointments.pending, state => { state.appointmentsLoading = true; })
      .addCase(loadMyAppointments.fulfilled, (state, action) => { state.appointmentsLoading = false; state.appointments = action.payload; })
      .addCase(loadMyAppointments.rejected, state => { state.appointmentsLoading = false; })

      .addCase(bookAppointment.pending, state => { state.bookBusy = true; state.error = null; })
      .addCase(bookAppointment.fulfilled, state => { state.bookBusy = false; })
      .addCase(bookAppointment.rejected, (state, action) => { state.bookBusy = false; state.error = action.payload; })

      .addCase(orderMedicine.pending, state => { state.medicineBusy = true; })
      .addCase(orderMedicine.fulfilled, state => { state.medicineBusy = false; })
      .addCase(orderMedicine.rejected, (state, action) => { state.medicineBusy = false; state.error = action.payload; });
  },
});

export const { clearSlots } = healthcareSlice.actions;
export default healthcareSlice.reducer;
