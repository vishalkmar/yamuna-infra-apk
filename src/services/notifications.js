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

// ── SOS alarm ────────────────────────────────────────────────────────────
// Plays the custom siren (android/app/src/main/res/raw/sos_alarm.mp3) the
// instant an SOS is fired. Uses a dedicated high-importance channel so the
// custom sound (not the system default) is used, and rings even if the screen
// is off. Bump the channel id if the sound/vibration ever changes.
const SOS_CHANNEL_ID = 'sos-alarm-v1';
const SOS_VIBRATION = [0, 500, 300, 500, 300, 500];

export async function playSosAlarm() {
  const mod = lib();
  if (!mod || Platform.OS === 'web') return;
  const notifee = mod.default;
  const { AndroidImportance, AndroidCategory, AndroidVisibility } = mod;
  try {
    await notifee.requestPermission();
    await notifee.createChannel({
      id: SOS_CHANNEL_ID,
      name: 'Emergency SOS',
      importance: AndroidImportance.HIGH,
      sound: 'sos_alarm', // raw/sos_alarm.mp3 (no extension)
      vibration: true,
      vibrationPattern: SOS_VIBRATION,
      visibility: AndroidVisibility ? AndroidVisibility.PUBLIC : undefined,
    });
    await notifee.displayNotification({
      id: 'sos-alarm',
      title: '🆘 SOS Activated',
      body: 'Emergency alert sent — help is on the way.',
      android: {
        channelId: SOS_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.ALARM,
        sound: 'sos_alarm',
        vibrationPattern: SOS_VIBRATION,
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default' },
        lightUpScreen: true,
      },
    });
  } catch (e) {
    // best-effort — never let the alarm break the SOS flow
  }
}

export async function cancelReminder(id) {
  const mod = lib();
  if (!mod) return;
  try { await mod.default.cancelTriggerNotification(String(id)); } catch (e) { /* noop */ }
}

// Cancel every scheduled reminder and re-schedule the current active set.
// Called whenever the reminder list changes (add / remove / load).
// Personal reminders ring as a real ALARM via the native YIAlarm module
// (exact time, app closed, after reboot, full-screen over the lock screen).
// Falls back to notifee on builds without it. Only reminder alarms are
// touched — payment due reminders and other notifications stay scheduled.
const alarm = () => require('react-native').NativeModules.YIAlarm;
// One native alarm per (reminder, time): rem-<id>-<n>.
function alarmsFor(r) {
  const times = r.times && r.times.length ? r.times : [r.timeLabel || '08:00'];
  const all7 = !r.days || r.days.length === 7;
  const days = r.repeat === 'once' || r.repeat === 'daily' || all7 ? '' : r.days.join(',');
  return times.map((t, i) => {
    const [h, m] = String(t).split(':').map(Number);
    let date = '';
    if (r.repeat === 'once') {
      if (r.date) date = r.date;
      else {
        // "once" without a date → the next time this clock time comes round
        const d = new Date(); d.setHours(h, m, 0, 0);
        if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
        date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    }
    return { id: `rem-${r.id}-${i}`, h: h || 0, m: m || 0, days, date };
  });
}

export async function rescheduleAll(reminders = []) {
  await ensureNotifPermission();
  const on = reminders.filter(r => r && r.active !== false && r.enabled !== false);
  const A = alarm();
  if (A) {
    try {
      const plan = on.flatMap(r => alarmsFor(r).map(a => ({ ...a, r })));
      await A.sync(plan.map(a => a.id)); // drops alarms of deleted / switched-off reminders
      for (const a of plan) {
        const meta = categoryMeta(a.r.category);
        await A.schedule(a.id, a.h, a.m, `${meta.icon} ${a.r.title || a.r.medicine || 'Reminder'}`, a.r.note || a.r.dosage || meta.label, a.days, a.date);
      }
    } catch (e) { /* best effort */ }
    return;
  }
  const mod = lib();
  if (!mod) return;
  for (const r of on) await scheduleReminder(r);
}

export async function cancelReminderAlarm(id) {
  const A = alarm();
  if (A) {
    try {
      const list = await A.list();
      await Promise.all(list.filter(x => x.id === `rem-${id}` || x.id.startsWith(`rem-${id}-`)).map(x => A.cancel(x.id)));
    } catch (e) { /* noop */ }
  }
  await cancelReminder(id);
}

export async function exactAlarmAllowed() {
  const A = alarm();
  if (!A) return true;
  try { return await A.canScheduleExact(); } catch (e) { return true; }
}
export function openExactAlarmSettings() { const A = alarm(); return A ? A.openExactAlarmSettings() : null; }
export function testAlarm(title) { const A = alarm(); return A ? A.test(title || '⏰ Test reminder') : null; }
