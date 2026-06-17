import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import WellnessCheckinSheet from '../../components/WellnessCheckinSheet';
import ReminderSheet from '../../components/ReminderSheet';
import { palette, spacing, typography } from '../../theme';
import { formatDate } from '../../utils/format';
import { categoryMeta, to12hLabel } from '../../utils/reminders';
import { rescheduleAll, cancelReminder } from '../../services/notifications';
import {
  loadReminders, loadCheckins, loadDailyContent, removeReminder,
} from '../../store/slices/companionSlice';

const MOOD_ICON = ['😟', '😕', '😐', '🙂', '😄'];

export default function AICompanionScreen() {
  const dispatch = useDispatch();
  const { reminders, checkins, dailyContent } = useSelector(s => s.companion);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);

  const reload = useCallback(() => {
    dispatch(loadReminders());
    dispatch(loadCheckins());
    dispatch(loadDailyContent());
  }, [dispatch]);

  useEffect(() => { reload(); }, [reload]);

  // Keep device alarms in sync with the reminder list (add / remove / load).
  useEffect(() => { rescheduleAll(reminders); }, [reminders]);

  const onRemove = id => { dispatch(removeReminder(id)); cancelReminder(id); };

  const lastCheckin = checkins[0];

  return (
    <ScreenContainer refreshing={false} onRefresh={reload}>
      {/* Daily content */}
      {dailyContent ? (
        <Card style={styles.hero}>
          <Text style={styles.heroLabel}>🌅 TODAY</Text>
          <Text style={styles.quote}>“{dailyContent.quote}”</Text>
          <Text style={styles.heroSub}>🎵 {dailyContent.bhajan}  ·  🛕 {dailyContent.templeSuggestion}</Text>
        </Card>
      ) : null}

      {/* Chat moved to the floating 🤖 button (bottom-right, beside SOS) */}
      <Card style={styles.chatHint}>
        <Text style={styles.chatHintText}>🤖 Tap the Companion button (bottom-right) anytime to chat about darshan, payments or services.</Text>
      </Card>

      {/* Wellness check-in */}
      <View style={styles.rowBetween}>
        <Text style={typography.h3}>Daily wellness</Text>
        <TouchableOpacity onPress={() => setCheckinOpen(true)}><Text style={styles.action}>Check in</Text></TouchableOpacity>
      </View>
      <Card style={styles.card}>
        {lastCheckin ? (
          <Text style={typography.body}>
            {MOOD_ICON[lastCheckin.moodScore - 1] || '🙂'} Last check-in {formatDate(lastCheckin.createdAt)}
            {lastCheckin.painLevel ? ` · pain ${lastCheckin.painLevel}/10` : ''}
          </Text>
        ) : (
          <Text style={typography.bodyMuted}>No check-in yet today. Tap “Check in” to record your mood.</Text>
        )}
      </Card>

      {/* Reminders (any category) */}
      <View style={styles.rowBetween}>
        <Text style={typography.h3}>Reminders</Text>
        <TouchableOpacity onPress={() => setReminderOpen(true)}><Text style={styles.action}>＋ Add</Text></TouchableOpacity>
      </View>
      {reminders.length === 0 ? (
        <Card style={styles.card}><Text style={typography.bodyMuted}>No reminders set. Add one for medicine, payments, darshan and more.</Text></Card>
      ) : reminders.map(r => (
        <Card key={r.id} style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.flex1}>
              <Text style={styles.name}>{categoryMeta(r.category).icon} {r.title}</Text>
              <Text style={typography.caption}>{r.note ? `${r.note} · ` : ''}⏰ {to12hLabel(r.timeLabel)}</Text>
            </View>
            <TouchableOpacity onPress={() => onRemove(r.id)}><Text style={styles.remove}>Remove</Text></TouchableOpacity>
          </View>
        </Card>
      ))}

      <WellnessCheckinSheet visible={checkinOpen} onClose={() => setCheckinOpen(false)} onDone={() => dispatch(loadCheckins())} />
      <ReminderSheet visible={reminderOpen} onClose={() => setReminderOpen(false)} onDone={() => dispatch(loadReminders())} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: palette.primary, borderColor: palette.primary, marginBottom: spacing.md },
  heroLabel: { color: '#A8B2D4', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  quote: { color: '#fff', fontSize: 15, fontWeight: '600', marginTop: 6, lineHeight: 21 },
  heroSub: { color: '#DBE3FF', fontSize: 12, marginTop: spacing.sm },

  chatHint: { backgroundColor: palette.surfaceAlt, marginBottom: spacing.sm },
  chatHintText: { fontSize: 13, color: palette.text, lineHeight: 19 },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm, marginBottom: spacing.sm },
  action: { color: palette.primary, fontWeight: '700', fontSize: 13 },
  card: { marginBottom: spacing.sm },
  name: { fontSize: 15, fontWeight: '700', color: palette.text },
  remove: { color: palette.error, fontWeight: '600', fontSize: 12 },
  flex1: { flex: 1 },
});
