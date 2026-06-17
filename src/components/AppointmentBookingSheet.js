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
import { loadSlots, bookAppointment, clearSlots } from '../store/slices/healthcareSlice';
import { showToast } from '../utils/toastConfig';

const CONSULTATION = [
  { value: 'video',  label: '📹 Video Call' },
  { value: 'home',   label: '🏠 Home Visit' },
  { value: 'clinic', label: '🏥 Clinic Visit' },
];

function todayIso() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10);
}

const schema = Yup.object().shape({
  consultationType: Yup.string().oneOf(['video', 'home', 'clinic']).required('Choose consultation type'),
  date: Yup.string().required('Pick a date').matches(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  timeSlot: Yup.string().required('Pick a slot'),
  symptoms: Yup.string().min(10, 'Min 10 characters').max(500).required('Describe symptoms'),
  patientName: Yup.string().min(2).max(120).required('Patient name required'),
  patientAge: Yup.number().typeError('Enter age').min(1).max(120).required('Age required'),
});

const defaults = () => ({ consultationType: 'video', date: todayIso(), timeSlot: '', symptoms: '', patientName: '', patientAge: '' });

export default function AppointmentBookingSheet({ visible, doctor, onClose, onBooked }) {
  const dispatch = useDispatch();
  const { slots, slotsLoading, bookBusy } = useSelector(s => s.healthcare);

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: defaults(),
  });

  const date = watch('date');

  useEffect(() => { if (visible) reset(defaults()); }, [visible, reset]);

  useEffect(() => {
    if (!visible || !doctor) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { dispatch(clearSlots()); return; }
    dispatch(loadSlots({ doctorId: doctor.id, date }));
    setValue('timeSlot', '');
  }, [visible, date, doctor, dispatch, setValue]);

  const submit = async data => {
    try {
      const res = await dispatch(bookAppointment({
        doctorId: doctor.id,
        specialty: doctor.specialty,
        consultationType: data.consultationType,
        date: data.date,
        timeSlot: data.timeSlot,
        symptoms: data.symptoms,
        patientName: data.patientName,
        patientAge: Number(data.patientAge),
      })).unwrap();
      showToast('success', 'Appointment confirmed', `With ${doctor.name} on ${data.date} at ${data.timeSlot}. ${res.appointmentCode}`);
      onBooked?.();
      onClose();
    } catch (e) {
      showToast('error', 'Could not book', String(e));
    }
  };

  if (!doctor) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={typography.h2}>Book Appointment</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}><Text style={styles.close}>×</Text></TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.docBadge}>
              <Text style={styles.docName}>{doctor.name}</Text>
              <Text style={typography.caption}>{doctor.specialty} · ★ {doctor.rating} · ₹{doctor.fee}</Text>
            </View>

            <Controller control={control} name="consultationType" render={({ field: { value, onChange } }) => (
              <RadioGroup label="Consultation type" value={value} onChange={onChange} direction="column" options={CONSULTATION} error={errors.consultationType?.message} />
            )} />

            <Controller control={control} name="date" render={({ field: { value, onChange } }) => (
              <Input label="Date" value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCorrect={false} error={errors.date?.message} hint="Today or later" />
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

            <Controller control={control} name="patientName" render={({ field: { value, onChange } }) => (
              <Input label="Patient name" value={value} onChangeText={onChange} placeholder="Self or family member" error={errors.patientName?.message} />
            )} />
            <Controller control={control} name="patientAge" render={({ field: { value, onChange } }) => (
              <Input label="Patient age" value={String(value)} onChangeText={onChange} keyboardType="number-pad" maxLength={3} placeholder="Years" error={errors.patientAge?.message} />
            )} />
            <Controller control={control} name="symptoms" render={({ field: { value, onChange } }) => (
              <Input label="Symptoms / reason" value={value} onChangeText={onChange} multiline numberOfLines={3} maxLength={500} placeholder="Describe symptoms or reason for visit…" error={errors.symptoms?.message} />
            )} />

            <Button title={bookBusy ? 'Booking…' : 'Confirm Appointment'} onPress={handleSubmit(submit)} loading={bookBusy} style={{ marginTop: spacing.md }} />
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
  docBadge: { backgroundColor: palette.surfaceAlt, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  docName: { fontSize: 15, fontWeight: '700', color: palette.text },
  slotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 6 },
  slot: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.md, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, marginRight: spacing.sm, marginBottom: spacing.sm },
  slotActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  slotText: { fontSize: 13, fontWeight: '700', color: palette.text },
  slotTextActive: { color: '#fff' },
  noSlot: { color: palette.error, marginTop: spacing.sm, fontSize: 13 },
  err: { color: palette.error, fontSize: 12, marginTop: 4 },
});
