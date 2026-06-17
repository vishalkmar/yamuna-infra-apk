import { Platform } from 'react-native';
import { nextOccurrenceMs, categoryMeta, to12hLabel } from '../utils/reminders';

// Wrapper around @notifee/react-native for Reminders 2.0 (Module 29).
// notifee is a native module — lazy-required and fully guarded so the JS
// (and Jest) never crashes if the native side isn't present (e.g. before an
// APK rebuild, or on web).
function lib() {
  try {
    return require('@notifee/react-native');
  } catch (e) {
    return null;
  }
}

// Android channels are immutable once created — bump the id whenever the
// sound/vibration config changes so the new settings actually take effect.
const CHANNEL_ID = 'reminders-alarm-v2';
const VIBRATION_PATTERN = [300, 600, 300, 600];

// Ask for notification permission and (re)create the high-importance,
// sound + vibration enabled channel.
export async function ensureNotifPermission() {
  const mod = lib();
  if (!mod || Platform.OS === 'web') return false;
  const notifee = mod.default;
  try {
    const settings = await notifee.requestPermission();
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Reminders & Alarms',
      importance: mod.AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      vibrationPattern: VIBRATION_PATTERN,
      // show as a heads-up banner + make sound by default
      visibility: mod.AndroidVisibility ? mod.AndroidVisibility.PUBLIC : undefined,
    });
    // 1 = AUTHORIZED, 2 = PROVISIONAL
    return (settings?.authorizationStatus ?? 0) >= 1;
  } catch (e) {
    return false;
  }
}

// Schedule a single daily reminder as a device alarm. Uses reminder.id as the
// notification id so re-scheduling replaces (not duplicates).
export async function scheduleReminder(reminder) {
  const mod = lib();
  if (!mod || !reminder || reminder.active === false) return;
  const notifee = mod.default;
  const { TriggerType, RepeatFrequency, AndroidImportance, AndroidCategory } = mod;
  try {
    await notifee.createTriggerNotification(
      {
        id: String(reminder.id),
        title: `${categoryMeta(reminder.category).icon} ${reminder.title}`,
        body: reminder.note || `Reminder · ${to12hLabel(reminder.timeLabel)}`,
        android: {
          channelId: CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          category: AndroidCategory.ALARM,
          sound: 'default',
          vibrationPattern: VIBRATION_PATTERN,
          loopSound: true,
          lightUpScreen: true,
          pressAction: { id: 'default' },
          fullScreenAction: { id: 'default' },
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: nextOccurrenceMs(reminder.timeLabel),
        repeatFrequency: RepeatFrequency.DAILY,
        alarmManager: { allowWhileIdle: true },
      },
    );
  } catch (e) {
    // swallow — scheduling is best-effort
  }
}

export async function cancelReminder(id) {
  const mod = lib();
  if (!mod) return;
  try { await mod.default.cancelTriggerNotification(String(id)); } catch (e) { /* noop */ }
}

// Cancel every scheduled reminder and re-schedule the current active set.
// Called whenever the reminder list changes (add / remove / load).
export async function rescheduleAll(reminders = []) {
  const mod = lib();
  if (!mod) return;
  await ensureNotifPermission();
  try { await mod.default.cancelTriggerNotifications(); } catch (e) { /* noop */ }
  for (const r of reminders) {
    if (r && r.active !== false) {
      await scheduleReminder(r);
    }
  }
}
