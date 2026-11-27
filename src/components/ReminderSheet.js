import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import Input from './Input';
import Button from './Button';
import Dropdown from './Dropdown';
import TimeWheel from './TimeWheel';
import { palette, spacing, typography } from '../theme';
import { addReminder } from '../store/slices/companionSlice';
import { companionApi } from '../api/companionApi';
import { showToast } from '../utils/toastConfig';
import { REMINDER_CATEGORIES, to24, to12hLabel, parse24, REPEATS, DAY_SHORT, repeatSummary } from '../utils/reminders';
import { ensureNotifPermission, exactAlarmAllowed, openExactAlarmSettings } from '../services/notifications';

// Add / edit an alarm-clock reminder: several times a day, repeat rule
// (once · daily · weekdays · weekends · custom days), title, note, type.
const CATEGORY_OPTS = REMINDER_CATEGORIES.map(c => ({ value: c.value, label: `${c.icon} ${c.label}` }));

function nextDates(n = 14) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.now() + i * 86400000);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    out.push({ iso, label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) });
  }
  return out;
}

const blank = () => {
  const d = new Date(Date.now() + 60 * 60000);
  return { category: 'medicine', title: '', note: '', times: [to24(((d.getHours() + 11) % 12) + 1, 0, d.getHours() >= 12 ? 'PM' : 'AM')], repeat: 'daily', days: [0, 1, 2, 3, 4, 5, 6], date: nextDates(1)[0].iso };
};

export default function ReminderSheet({ visible, onClose, onDone, editing }) {
  const dispatch = useDispatch();
  const { reminderBusy } = useSelector(s => s.companion);
  const [form, setForm] = useState(blank());
  const [cur, setCur] = useState(0); // which time is being edited on the wheel
  const [titleErr, setTitleErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitleErr(''); setCur(0);
    setForm(editing ? {
      category: editing.category || 'other', title: editing.title || '', note: editing.note || '',
      times: editing.times?.length ? editing.times : [editing.timeLabel || '08:00'],
      repeat: editing.repeat || 'daily', days: editing.days?.length ? editing.days : [0, 1, 2, 3, 4, 5, 6],
      date: editing.date || nextDates(1)[0].iso,
    } : blank());
  }, [visible, editing]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const wheel = parse24(form.times[cur] || '08:00');
  const setWheel = v => setForm(f => {
    const times = [...f.times];
    times[cur] = to24(v.hour12, v.minute, v.period);
    return { ...f, times };
  });
  const addTime = () => {
    if (form.times.length >= 12) return;
    const last = parse24(form.times[form.times.length - 1] || '08:00');
    let h24 = (Number(to24(last.hour12, last.minute, last.period).slice(0, 2)) + 4) % 24;
    const t = `${String(h24).padStart(2, '0')}:${String(last.minute).padStart(2, '0')}`;
    setForm(f => ({ ...f, times: [...f.times, t] }));
    setCur(form.times.length);
  };
  const removeTime = i => {
    if (form.times.length <= 1) return;
    setForm(f => ({ ...f, times: f.times.filter((_, j) => j !== i) }));
    setCur(c => Math.max(0, c >= i ? c - 1 : c));
  };
  const toggleDay = d => setForm(f => {
    const has = f.days.includes(d);
    const days = has ? f.days.filter(x => x !== d) : [...f.days, d].sort();
    return { ...f, days: days.length ? days : f.days, repeat: 'custom' };
  });
  const pickRepeat = r => setForm(f => ({
    ...f, repeat: r,
    days: r === 'weekdays' ? [1, 2, 3, 4, 5] : r === 'weekends' ? [0, 6] : r === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : f.days,
  }));

  const submit = async () => {
    if (form.title.trim().length < 2) { setTitleErr('Enter what to remind you about'); return; }
    const times = [...new Set(form.times)].sort();
    const payload = {
      category: form.category, title: form.title.trim(), note: form.note.trim() || undefined, times,
      repeat: form.repeat, days: form.repeat === 'custom' ? form.days : undefined, date: form.repeat === 'once' ? form.date : undefined,
    };
    try {
      setBusy(true);
      if (editing) await companionApi.updateReminder(editing.id, { ...payload, enabled: true });
      else await dispatch(addReminder(payload)).unwrap();
      await ensureNotifPermission();
      showToast('success', editing ? 'Reminder updated ⏰' : 'Reminder set ⏰',
        `${payload.title} · ${times.map(to12hLabel).join(', ')} · ${repeatSummary(payload)}${editing ? '' : '. Confirmation sent to your email.'}`);
      if (!(await exactAlarmAllowed())) { showToast('info', 'Allow alarms', 'Turn on “Alarms & reminders” so it rings on time.'); openExactAlarmSettings(); }
      onDone?.();
      onClose();
    } catch (e) {
      showToast('error', 'Could not save', String(e?.response?.data?.message || e));
    } finally { setBusy(false); }
  };

  const remove = async () => {
    try { await companionApi.deleteReminder(editing.id); onDone?.(); onClose(); showToast('success', 'Reminder deleted'); }
    catch (e) { showToast('error', 'Could not delete', String(e)); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={typography.h2}>{editing ? 'Edit reminder' : 'New reminder'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}><Text style={styles.close}>×</Text></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
            {/* Times */}
            <Text style={styles.group}>Time{form.times.length > 1 ? `s (${form.times.length})` : ''}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeChips}>
              {form.times.map((t, i) => (
                <TouchableOpacity key={`${t}-${i}`} onPress={() => setCur(i)} onLongPress={() => removeTime(i)} activeOpacity={0.8}
                  style={[styles.tChip, i === cur && styles.tChipOn]}>
                  <Text style={[styles.tChipText, i === cur && { color: '#fff' }]}>{to12hLabel(t)}</Text>
                  {form.times.length > 1 ? (
                    <TouchableOpacity onPress={() => removeTime(i)} hitSlop={8}><Text style={[styles.tX, i === cur && { color: '#fff' }]}>✕</Text></TouchableOpacity>
                  ) : null}
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={addTime} style={styles.addTime} activeOpacity={0.8}><Text style={styles.addTimeText}>＋ Add time</Text></TouchableOpacity>
            </ScrollView>
            <TimeWheel key={cur} value={wheel} onChange={setWheel} />

            {/* Repeat */}
            <Text style={styles.group}>Repeat</Text>
            <View style={styles.wrap}>
              {REPEATS.map(r => (
                <TouchableOpacity key={r.value} onPress={() => pickRepeat(r.value)} style={[styles.chip, form.repeat === r.value && styles.chipOn]} activeOpacity={0.8}>
                  <Text style={[styles.chipText, form.repeat === r.value && { color: '#fff' }]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {form.repeat !== 'once' ? (
              <View style={styles.days}>
                {DAY_SHORT.map((d, i) => {
                  const on = form.days.includes(i);
                  return (
                    <TouchableOpacity key={d} onPress={() => toggleDay(i)} style={[styles.day, on && styles.dayOn]} activeOpacity={0.8}>
                      <Text style={[styles.dayText, on && { color: '#fff' }]}>{d.charAt(0)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeChips}>
                {nextDates(21).map(d => (
                  <TouchableOpacity key={d.iso} onPress={() => set('date', d.iso)} style={[styles.chip, form.date === d.iso && styles.chipOn]}>
                    <Text style={[styles.chipText, form.date === d.iso && { color: '#fff' }]}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <Text style={styles.preview}>⏰ {repeatSummary(form)} at {form.times.map(to12hLabel).join(', ')} — rings like an alarm, even if the app is closed</Text>

            {/* Details */}
            <Input label="Title" value={form.title} onChangeText={v => { set('title', v); if (titleErr) setTitleErr(''); }}
              placeholder="e.g. BP tablet, EMI due, Mangla aarti" error={titleErr} />
            <Input label="Note (optional)" value={form.note} onChangeText={v => set('note', v)} placeholder="e.g. 5mg after food" />
            <Dropdown label="Type" value={form.category} options={CATEGORY_OPTS} onChange={v => set('category', v)} />

            <Button title={busy || reminderBusy ? 'Saving…' : editing ? 'Save changes' : 'Set reminder'} onPress={submit} loading={busy || reminderBusy} style={{ marginTop: spacing.md }} />
            {editing ? (
              <TouchableOpacity onPress={remove} style={{ marginTop: spacing.md, alignItems: 'center' }}>
                <Text style={styles.delete}>Delete reminder</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: palette.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: spacing.xxl, maxHeight: '94%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  close: { fontSize: 26, color: palette.textMuted },
  group: { ...typography.label, color: palette.primary, marginBottom: spacing.sm, marginTop: spacing.md },
  timeChips: { gap: 8, paddingBottom: 10 },
  tChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14, backgroundColor: '#E3ECFB' },
  tChipOn: { backgroundColor: palette.primary },
  tChipText: { fontWeight: '800', color: palette.navy, fontSize: 14 },
  tX: { color: palette.navy, fontSize: 12, fontWeight: '800' },
  addTime: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14, borderWidth: 1.5, borderColor: palette.primary, borderStyle: 'dashed' },
  addTimeText: { color: palette.primary, fontWeight: '800', fontSize: 13 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14, backgroundColor: '#EEF2FA' },
  chipOn: { backgroundColor: palette.primary },
  chipText: { fontWeight: '700', color: palette.navy, fontSize: 13 },
  days: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  day: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEF2FA', alignItems: 'center', justifyContent: 'center' },
  dayOn: { backgroundColor: palette.primary },
  dayText: { fontWeight: '800', color: palette.navy },
  preview: { ...typography.caption, color: palette.primary, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  delete: { color: palette.error, fontWeight: '800', fontSize: 14 },
});
