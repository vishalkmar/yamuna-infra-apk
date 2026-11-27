import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import ReminderSheet from '../../components/ReminderSheet';
import { palette, spacing, typography } from '../../theme';
import { categoryMeta, to12hLabel, DAY_SHORT, repeatSummary } from '../../utils/reminders';
import { companionApi } from '../../api/companionApi';
import { showToast } from '../../utils/toastConfig';
import { rescheduleAll, exactAlarmAllowed, openExactAlarmSettings, testAlarm } from '../../services/notifications';
import { loadReminders } from '../../store/slices/companionSlice';

// Set Reminder — the resident's alarm clock: set reminders and see / switch
// on-off the ones already set. (Route name stays "AICompanion".)
export default function SetReminderScreen() {
  const dispatch = useDispatch();
  const { reminders } = useSelector(s => s.companion);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [localOff, setLocalOff] = useState({});
  const [exactOk, setExactOk] = useState(true);

  const reload = useCallback(() => { dispatch(loadReminders()); }, [dispatch]);
  useEffect(() => { reload(); }, [reload]);

  // Keep device alarms in sync with the reminder list (add / edit / delete / on-off).
  useEffect(() => { rescheduleAll(reminders); }, [reminders]);
  useEffect(() => { exactAlarmAllowed().then(setExactOk); }, [reminders]);

  // On/off switch: an "off" reminder keeps its settings but its alarms are cancelled.
  const toggle = async (r, v) => {
    setLocalOff(o => ({ ...o, [r.id]: !v }));
    try { await companionApi.toggleReminder(r.id, v); dispatch(loadReminders()); showToast('success', v ? 'Reminder on ⏰' : 'Reminder off', r.title); }
    catch (e) { setLocalOff(o => ({ ...o, [r.id]: v })); showToast('error', 'Could not change', String(e)); }
  };

  return (
    <ScreenContainer refreshing={false} onRefresh={reload}>
      {!exactOk ? (
        <TouchableOpacity onPress={openExactAlarmSettings} activeOpacity={0.85}>
          <Card style={styles.warn}>
            <Text style={styles.warnTitle}>⚠️ Allow alarms for exact reminders</Text>
            <Text style={styles.warnText}>Tap here → turn on “Alarms & reminders” for Yamuna Infra so your reminders ring on time.</Text>
          </Card>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity onPress={() => setReminderOpen(true)} activeOpacity={0.85} style={styles.addBtn}>
        <Text style={styles.addText}>＋ Set reminder</Text>
      </TouchableOpacity>

      <View style={styles.rowBetween}>
        <Text style={typography.h3}>Your reminders</Text>
        {reminders.length ? <Text style={typography.caption}>{reminders.length}</Text> : null}
      </View>
      {reminders.length === 0 ? (
        <Card style={styles.card}><Text style={typography.bodyMuted}>No reminders yet. Tap ＋ Set reminder — set one or more times, choose daily / weekdays / custom days, and it rings like an alarm even when the app is closed.</Text></Card>
      ) : reminders.map(r => {
        const on = localOff[r.id] != null ? !localOff[r.id] : r.enabled !== false;
        const times = r.times && r.times.length ? r.times : [r.timeLabel];
        return (
          <TouchableOpacity key={r.id} activeOpacity={0.85} onPress={() => setEditing(r)}>
            <Card style={[styles.card, !on && { opacity: 0.55 }]}>
              <View style={styles.alarmRow}>
                <View style={styles.flex1}>
                  <Text style={styles.alarmTime} numberOfLines={1} adjustsFontSizeToFit>{times.map(to12hLabel).join('  ·  ')}</Text>
                  <Text style={styles.name}>{categoryMeta(r.category).icon} {r.title}</Text>
                  {r.note ? <Text style={typography.caption}>{r.note}</Text> : null}
                  <View style={styles.dayRow}>
                    {r.repeat === 'once'
                      ? <Text style={styles.onceText}>{repeatSummary(r)}</Text>
                      : DAY_SHORT.map((d, i) => (
                        <Text key={d} style={[styles.dayLetter, (r.days || [0, 1, 2, 3, 4, 5, 6]).includes(i) && styles.dayLetterOn]}>{d.charAt(0)}</Text>
                      ))}
                  </View>
                </View>
                <Switch
                  value={on}
                  onValueChange={v => toggle(r, v)}
                  trackColor={{ false: '#CBD5E1', true: '#93B4F5' }}
                  thumbColor={on ? palette.primary : '#F1F5F9'}
                />
              </View>
            </Card>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity onPress={() => testAlarm('⏰ Test reminder')} activeOpacity={0.85}>
        <Text style={styles.test}>🔔 Test alarm (rings in 5 seconds)</Text>
      </TouchableOpacity>

      <ReminderSheet visible={reminderOpen || !!editing} editing={editing} onClose={() => { setReminderOpen(false); setEditing(null); }} onDone={() => { setLocalOff({}); dispatch(loadReminders()); }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  addBtn: { backgroundColor: palette.primary, borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginBottom: spacing.md },
  addText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm, marginBottom: spacing.sm },
  card: { marginBottom: spacing.sm },
  name: { fontSize: 15, fontWeight: '700', color: palette.text },
  alarmRow: { flexDirection: 'row', alignItems: 'center' },
  alarmTime: { fontSize: 26, fontWeight: '800', color: palette.navy, marginBottom: 2 },
  dayRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  dayLetter: { fontSize: 12, fontWeight: '700', color: '#CBD5E1', width: 16, textAlign: 'center' },
  dayLetterOn: { color: palette.primary },
  onceText: { fontSize: 12, fontWeight: '700', color: palette.primary },
  warn: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA', marginBottom: spacing.sm },
  warnTitle: { fontWeight: '800', color: '#9A3412', fontSize: 14 },
  warnText: { color: '#9A3412', fontSize: 12.5, marginTop: 4 },
  test: { color: palette.primary, fontWeight: '700', fontSize: 13, textAlign: 'center', marginVertical: spacing.sm },
  flex1: { flex: 1 },
});
