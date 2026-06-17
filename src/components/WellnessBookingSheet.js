import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';

import Input from './Input';
import Button from './Button';
import RadioGroup from './RadioGroup';
import { palette, radius, spacing, typography } from '../theme';
import { loadSlots, bookTherapy, clearSlots } from '../store/slices/wellnessSlice';
import { showToast } from '../utils/toastConfig';

function minDate(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

const DURATIONS = [
  { value: 30, label: '30 min' },
  { value: 60, label: '60 min' },
  { value: 90, label: '90 min' },
];
const GENDERS = [
  { value: 'any', label: 'No preference' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const schema = Yup.object().shape({
  durationMin: Yup.number().oneOf([30, 60, 90]).required(),
  therapistGender: Yup.string().oneOf(['male', 'female', 'any']).required(),
  date: Yup.string().required('Pick a date').matches(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  timeSlot: Yup.string().required('Pick a slot'),
  healthNote: Yup.string().max(200, 'Max 200 characters').nullable(),
});

const defaults = () => ({ durationMin: 60, therapistGender: 'any', date: minDate(), timeSlot: '', healthNote: '' });

export default function WellnessBookingSheet({ visible, therapy, onClose, onBooked }) {
  const dispatch = useDispatch();
  const { slots, slotsLoading, bookBusy } = useSelector(s => s.wellness);

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: defaults(),
  });

  const date = watch('date');
  const note = watch('healthNote') || '';

  useEffect(() => { if (visible) reset(defaults()); }, [visible, reset]);

  useEffect(() => {
    if (!visible) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { dispatch(clearSlots()); return; }
    dispatch(loadSlots(date));
    setValue('timeSlot', '');
  }, [visible, date, dispatch, setValue]);

  const submit = async data => {
    try {
      const res = await dispatch(bookTherapy({
        therapyId: therapy.id,
        durationMin: data.durationMin,
        therapistGender: data.therapistGender,
        date: data.date,
        timeSlot: data.timeSlot,
        healthNote: data.healthNote || undefined,
      })).unwrap();
      showToast(
        'success',
        res.isPackage ? 'Package activated!' : 'Booked!',
        res.isPackage ? `${therapy.name} course starts ${data.date}.` : `${therapy.name} on ${data.date} at ${data.timeSlot}.`,
      );
      onBooked?.();
      onClose();
    } catch (e) {
      showToast('error', 'Could not book', String(e));
    }
  };

  if (!therapy) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={typography.h2}>{therapy.icon} {therapy.name}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}><Text style={styles.close}>×</Text></TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={typography.caption}>
              {therapy.description} · ₹{therapy.price}{therapy.isPackage ? ` · ${therapy.packageDays}-day package` : ''}
            </Text>

            <Controller control={control} name="durationMin" render={({ field: { value, onChange } }) => (
              <RadioGroup label="Duration" value={value} onChange={onChange} options={DURATIONS} error={errors.durationMin?.message} />
            )} />

            <Controller control={control} name="therapistGender" render={({ field: { value, onChange } }) => (
              <RadioGroup label="Therapist preference" value={value} onChange={onChange} options={GENDERS} error={errors.therapistGender?.message} />
            )} />

            <Controller control={control} name="date" render={({ field: { value, onChange } }) => (
              <Input label="Date" value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCorrect={false} error={errors.date?.message} hint="Min: tomorrow" />
            )} />

            <View style={{ marginBottom: spacing.md }}>
              <Text style={typography.label}>Available slots</Text>
              {slotsLoading ? (
                <ActivityIndicator color={palette.primary} style={{ marginTop: spacing.sm }} />
              ) : slots.length === 0 ? (
                <Text style={styles.noSlot}>No slots for this date. Try another day.</Text>
              ) : (
                <Controller control={control} name="timeSlot" render={({ field: { value, onChange } }) => (
                  <View style={styles.slotRow}>
                    {slots.map(s => {
                      const sel = value === s;
                      return (
                        <TouchableOpacity key={s} style={[styles.slot, sel && styles.slotActive]} onPress={() => onChange(s)}>
                          <Text style={[styles.slotText, sel && styles.slotTextActive]}>{s}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )} />
              )}
              {errors.timeSlot ? <Text style={styles.err}>{errors.timeSlot.message}</Text> : null}
            </View>

            <Controller control={control} name="healthNote" render={({ field: { value, onChange } }) => (
              <Input label="Health note (optional)" value={value} onChangeText={onChange} multiline numberOfLines={2} maxLength={200} placeholder="Any condition, allergy, oil preference…" error={errors.healthNote?.message} hint={`${note.length} / 200`} />
            )} />

            <Button title={bookBusy ? 'Booking…' : 'Confirm Booking'} onPress={handleSubmit(submit)} loading={bookBusy} style={{ marginTop: spacing.md }} />
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
  slotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 6 },
  slot: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.md, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, marginRight: spacing.sm, marginBottom: spacing.sm },
  slotActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  slotText: { fontSize: 13, fontWeight: '700', color: palette.text },
  slotTextActive: { color: '#fff' },
  noSlot: { color: palette.error, marginTop: spacing.sm, fontSize: 13 },
  err: { color: palette.error, fontSize: 12, marginTop: 4 },
});
