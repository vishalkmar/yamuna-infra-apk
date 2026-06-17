import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import Input from './Input';
import Button from './Button';
import Stepper from './Stepper';
import { palette, radius, spacing, typography } from '../theme';
import { addCheckin } from '../store/slices/companionSlice';
import { showToast } from '../utils/toastConfig';

const MOODS = ['😟', '😕', '😐', '🙂', '😄'];
const ACTIVITIES = [
  { value: 'walk', label: '🚶 Walk' },
  { value: 'yoga', label: '🧘 Yoga' },
  { value: 'medication', label: '💊 Medication' },
  { value: 'temple', label: '🛕 Temple' },
  { value: 'meals', label: '🍲 Meals' },
];

export default function WellnessCheckinSheet({ visible, onClose, onDone }) {
  const dispatch = useDispatch();
  const { checkinBusy } = useSelector(s => s.companion);
  const [mood, setMood] = useState(4);
  const [note, setNote] = useState('');
  const [acts, setActs] = useState([]);
  const [pain, setPain] = useState(0);

  useEffect(() => {
    if (visible) { setMood(4); setNote(''); setActs([]); setPain(0); }
  }, [visible]);

  const submit = async () => {
    try {
      await dispatch(addCheckin({ moodScore: mood, healthNote: note || undefined, activities: acts, painLevel: pain })).unwrap();
      showToast('success', 'Check-in recorded', 'Family notified that you are doing well! 🙏');
      onDone?.();
      onClose();
    } catch (e) {
      showToast('error', 'Could not save', String(e));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={typography.h2}>Daily Check-in</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}><Text style={styles.close}>×</Text></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={typography.label}>How are you feeling today?</Text>
            <View style={styles.moodRow}>
              {MOODS.map((m, i) => {
                const val = i + 1;
                const sel = mood === val;
                return (
                  <TouchableOpacity key={val} style={[styles.mood, sel && styles.moodActive]} onPress={() => setMood(val)}>
                    <Text style={styles.moodIcon}>{m}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[typography.label, { marginTop: spacing.md }]}>What did you do today?</Text>
            <View style={styles.chipWrap}>
              {ACTIVITIES.map(a => {
                const sel = acts.includes(a.value);
                return (
                  <TouchableOpacity key={a.value} style={[styles.chip, sel && styles.chipActive]} onPress={() => setActs(sel ? acts.filter(x => x !== a.value) : [...acts, a.value])}>
                    <Text style={[styles.chipText, sel && styles.chipTextActive]}>{a.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ marginTop: spacing.md }}>
              <Stepper label="Pain / discomfort (0 = none)" value={pain} onChange={setPain} min={0} max={10} suffix={`/ 10`} />
            </View>

            <Input label="Note (optional)" value={note} onChangeText={setNote} multiline numberOfLines={2} maxLength={200} placeholder="How are you feeling today?" hint={`${note.length} / 200`} />

            <Button title={checkinBusy ? 'Saving…' : 'Submit Check-in'} onPress={submit} loading={checkinBusy} style={{ marginTop: spacing.md }} />
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
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  mood: { width: 54, height: 54, borderRadius: radius.md, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' },
  moodActive: { backgroundColor: '#E0E7FF', borderColor: palette.primary },
  moodIcon: { fontSize: 26 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, marginRight: spacing.sm, marginBottom: spacing.sm },
  chipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: palette.text },
  chipTextActive: { color: '#fff' },
});
