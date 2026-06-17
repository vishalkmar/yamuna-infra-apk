import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';

import Input from './Input';
import Button from './Button';
import RadioGroup from './RadioGroup';
import Stepper from './Stepper';
import { palette, spacing, typography } from '../theme';
import { bookPossessionAppointment } from '../store/slices/possessionSlice';
import { minBookableDate, validateVisitDate } from '../utils/visitDate';
import { showToast } from '../utils/toastConfig';

const SLOTS = ['09:00 AM – 12:00 PM', '02:00 PM – 05:00 PM'];

const schema = Yup.object().shape({
  appointmentDate: Yup.string().required('Pick a date').matches(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  timeSlot: Yup.string().oneOf(SLOTS).required('Pick a slot'),
  attendees: Yup.number().min(1).max(8).required(),
  specialRequest: Yup.string().max(300, 'Max 300 characters').nullable(),
});

const defaults = () => ({ appointmentDate: minBookableDate(), timeSlot: SLOTS[0], attendees: 2, specialRequest: '' });

export default function PossessionAppointmentSheet({ visible, bookingId, onClose, onBooked }) {
  const dispatch = useDispatch();
  const { apptBusy } = useSelector(s => s.possession);

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: defaults(),
  });

  useEffect(() => { if (visible) reset(defaults()); }, [visible, reset]);

  const special = watch('specialRequest') || '';

  const submit = async data => {
    const dateOk = validateVisitDate(data.appointmentDate);
    if (!dateOk.ok) {
      showToast('error', 'Invalid date', dateOk.reason);
      return;
    }
    try {
      await dispatch(bookPossessionAppointment({ bookingId, ...data })).unwrap();
      showToast('success', 'Confirmed!', `Possession appointment booked for ${data.appointmentDate}.`);
      onBooked?.();
      onClose();
    } catch (e) {
      showToast('error', 'Could not book', String(e));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={typography.h2}>Schedule Possession</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Controller
              control={control}
              name="appointmentDate"
              render={({ field: { value, onChange } }) => (
                <Input
                  label="Preferred date"
                  value={value}
                  onChangeText={onChange}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numbers-and-punctuation"
                  autoCorrect={false}
                  error={errors.appointmentDate?.message}
                  hint="Min: tomorrow"
                />
              )}
            />

            <Controller
              control={control}
              name="timeSlot"
              render={({ field: { value, onChange } }) => (
                <RadioGroup
                  label="Time slot"
                  value={value}
                  onChange={onChange}
                  direction="column"
                  options={SLOTS.map(s => ({ value: s, label: s }))}
                  error={errors.timeSlot?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="attendees"
              render={({ field: { value, onChange } }) => (
                <Stepper
                  label="Family members attending"
                  value={value}
                  onChange={onChange}
                  min={1}
                  max={8}
                  suffix={value === 1 ? 'person' : 'persons'}
                />
              )}
            />

            <Controller
              control={control}
              name="specialRequest"
              render={({ field: { value, onChange } }) => (
                <Input
                  label="Special request (optional)"
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={3}
                  maxLength={300}
                  placeholder="Any special arrangement needed…"
                  error={errors.specialRequest?.message}
                  hint={`${special.length} / 300`}
                />
              )}
            />

            <Button
              title={apptBusy ? 'Booking…' : 'Confirm Appointment'}
              onPress={handleSubmit(submit)}
              loading={apptBusy}
              style={{ marginTop: spacing.md }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: palette.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, paddingBottom: spacing.xxl,
    maxHeight: '92%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  close: { fontSize: 26, color: palette.textMuted },
});
