import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { companionApi } from '../../api/companionApi';

export const loadReminders = createAsyncThunk('companion/reminders', async () => companionApi.listReminders());
export const loadChat = createAsyncThunk('companion/chat', async () => companionApi.chatHistory());

export const addReminder = createAsyncThunk(
  'companion/addReminder',
  async (payload, { rejectWithValue }) => {
    try { await companionApi.addReminder(payload); return true; }
    catch (e) { return rejectWithValue(e?.response?.data?.message || 'Could not add reminder'); }
  },
);

export const removeReminder = createAsyncThunk('companion/removeReminder', async id => {
  await companionApi.deleteReminder(id);
  return { id };
});

export const sendChat = createAsyncThunk(
  'companion/sendChat',
  async (message, { getState, rejectWithValue }) => {
    try {
      const history = getState().companion.messages || [];
      return await companionApi.sendChat(message, history);
    } catch (e) { return rejectWithValue(e?.response?.data?.message || 'Chat failed'); }
  },
);

const initialState = {
  reminders: [],
  messages: [],
  reminderBusy: false,
  chatBusy: false,
  error: null,
};

const companionSlice = createSlice({
  name: 'companion',
  initialState,
  reducers: {
    pushUserMessage(state, action) {
      state.messages.push({ id: `local-${Date.now()}`, role: 'user', content: action.payload });
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadReminders.fulfilled, (state, action) => { state.reminders = action.payload; })
      .addCase(loadChat.fulfilled, (state, action) => { state.messages = action.payload; })


      .addCase(addReminder.pending, state => { state.reminderBusy = true; })
      .addCase(addReminder.fulfilled, state => { state.reminderBusy = false; })
      .addCase(addReminder.rejected, (state, action) => { state.reminderBusy = false; state.error = action.payload; })

      .addCase(removeReminder.fulfilled, (state, action) => {
        state.reminders = state.reminders.filter(r => r.id !== action.payload.id);
      })

      .addCase(sendChat.pending, state => { state.chatBusy = true; })
      .addCase(sendChat.fulfilled, (state, action) => {
        state.chatBusy = false;
        state.messages.push({ id: action.payload.id || `a-${Date.now()}`, role: 'assistant', content: action.payload.reply, cards: action.payload.cards || [] });
      })
      .addCase(sendChat.rejected, (state, action) => { state.chatBusy = false; state.error = action.payload; });
  },
});

export const { pushUserMessage } = companionSlice.actions;
export default companionSlice.reducer;
