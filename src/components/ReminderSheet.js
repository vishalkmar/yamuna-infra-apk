import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import Input from './Input';
import Button from './Button';
import Dropdown from './Dropdown';
import { palette, spacing, typography } from '../theme';
import { addReminder } from '../store/slices/companionSlice';
import { showToast } from '../utils/toastConfig';
import { REMINDER_CATEGORIES, to24, to12hLabel } from '../utils/reminders';
import { ensureNotifPermission } from '../services/notifications';

const CATEGORY_OPTS = REMINDER_CATEGORIES.map(c => ({ value: c.value, label: `${c.icon} ${c.label}` }));
const HOURS = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
const MINUTES = Array.from({ length: 12 }, (_, i) => ({ value: String(i * 5), label: String(i * 5).padStart(2, '0') }));
const PERIODS = [{ value: 'AM', label: 'AM' }, { value: 'PM', label: 'PM' }];

const initial = () => ({ category: 'medicine', title: '', note: '', hour12: '8', minute: '0', period: 'AM' });

export default function ReminderSheet({ visible, onClose, onDone }) {
  const dispatch = useDispatch();
  const { reminderBusy } = useSelector(s => s.companion);
  const [form, setForm] = useState(initial());
  const [titleErr, setTitleErr] = useState('');

  useEffect(() => { if (visible) { setForm(initial()); setTitleErr(''); } }, [visible]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const timeLabel = to24(form.hour12, form.minute, form.period);

  const submit = async () => {
    if (form.title.trim().length < 2) { setTitleErr('Enter what to remind you about'); return; }
    try {
      await dispatch(addReminder({
        category: form.category,
        title: form.title.trim(),
        note: form.note.trim() || undefined,
        timeLabel,
      })).unwrap();
      await ensureNotifPermission();
      showToast('success', 'Reminder set', `${form.title.trim()} at ${to12hLabel(timeLabel)}.`);
      onDone?.();
      onClose();
    } catch (e) {
      showToast('error', 'Could not add', String(e));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={typography.h2}>New Reminder</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}><Text style={styles.close}>×</Text></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Dropdown label="What for?" value={form.category} options={CATEGORY_OPTS} onChange={v => set('category', v)} />

            <Input
              label="Title"
              value={form.title}
              onChangeText={v => { set('title', v); if (titleErr) setTitleErr(''); }}
              placeholder="e.g. BP tablet, EMI due, Cook arrives"
              error={titleErr}
            />
            <Input
              label="Note (optional)"
              value={form.note}
              onChangeText={v => set('note', v)}
              placeholder="e.g. 5mg after food"
            />

            <Text style={styles.group}>Time</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeCol}><Dropdown label="Hour" value={form.hour12} options={HOURS} onChange={v => set('hour12', v)} /></View>
              <View style={styles.timeCol}><Dropdown label="Min" value={form.minute} options={MINUTES} onChange={v => set('minute', v)} /></View>
              <View style={styles.timeCol}><Dropdown label="AM/PM" value={form.period} options={PERIODS} onChange={v => set('period', v)} /></View>
            </View>
            <Text style={styles.preview}>⏰ Rings daily at {to12hLabel(timeLabel)} (device time)</Text>

            <Button title={reminderBusy ? 'Saving…' : 'Set Reminder'} onPress={submit} loading={reminderBusy} style={{ marginTop: spacing.md }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: palette.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: spacing.xxl, maxHeight: '92%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  close: { fontSize: 26, color: palette.textMuted },
  group: { ...typography.label, color: palette.primary, marginBottom: spacing.sm, marginTop: spacing.sm },
  timeRow: { flexDirection: 'row', gap: spacing.sm },
  timeCol: { flex: 1 },
  preview: { ...typography.caption, color: palette.primary, fontWeight: '600' },
});
