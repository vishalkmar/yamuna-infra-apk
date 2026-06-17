jest.mock('../src/api/companionApi', () => ({ companionApi: {} }));

import reducer, {
  pushUserMessage, loadChat, loadReminders, loadCheckins, loadDailyContent,
  addCheckin, addReminder, removeReminder, sendChat,
} from '../src/store/slices/companionSlice';

const initial = {
  checkins: [], reminders: [], messages: [], dailyContent: null,
  checkinBusy: false, reminderBusy: false, chatBusy: false, error: null,
};

describe('companionSlice', () => {
  it('starts in expected initial state', () => {
    expect(reducer(undefined, { type: 'init' })).toEqual(initial);
  });
  it('load thunks store their data', () => {
    expect(reducer(initial, { type: loadChat.fulfilled.type, payload: [{ id: 1, role: 'assistant', content: 'hi' }] }).messages).toHaveLength(1);
    expect(reducer(initial, { type: loadReminders.fulfilled.type, payload: [{ id: 1 }] }).reminders).toHaveLength(1);
    expect(reducer(initial, { type: loadCheckins.fulfilled.type, payload: [{ id: 1 }] }).checkins).toHaveLength(1);
    expect(reducer(initial, { type: loadDailyContent.fulfilled.type, payload: { quote: 'q' } }).dailyContent.quote).toBe('q');
  });
  it('pushUserMessage appends a user message', () => {
    const s = reducer(initial, pushUserMessage('when is aarti?'));
    expect(s.messages).toHaveLength(1);
    expect(s.messages[0].role).toBe('user');
  });
  it('sendChat.fulfilled appends assistant reply', () => {
    const pend = reducer(initial, { type: sendChat.pending.type });
    expect(pend.chatBusy).toBe(true);
    const done = reducer(pend, { type: sendChat.fulfilled.type, payload: { reply: 'Radhe Radhe' } });
    expect(done.chatBusy).toBe(false);
    expect(done.messages[done.messages.length - 1].role).toBe('assistant');
  });
  it('addCheckin + addReminder lifecycle toggle busy', () => {
    expect(reducer(initial, { type: addCheckin.pending.type }).checkinBusy).toBe(true);
    expect(reducer(initial, { type: addReminder.pending.type }).reminderBusy).toBe(true);
  });
  it('removeReminder.fulfilled filters out the reminder', () => {
    const state = { ...initial, reminders: [{ id: 1 }, { id: 2 }] };
    const s = reducer(state, { type: removeReminder.fulfilled.type, payload: { id: 1 } });
    expect(s.reminders).toEqual([{ id: 2 }]);
  });
});
