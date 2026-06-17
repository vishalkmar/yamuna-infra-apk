import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';

import Input from './Input';
import Button from './Button';
import RadioGroup from './RadioGroup';
import Stepper from './Stepper';
import Dropdown from './Dropdown';
import { palette, radius, spacing, typography } from '../theme';
import { loadSlots, bookVisit, rescheduleVisit, clearSlots } from '../store/slices/siteVisitSlice';
import { validateVisitDate, minBookableDate } from '../utils/visitDate';
import { showToast } from '../utils/toastConfig';

const schema = Yup.object().shape({
  visitDate: Yup.string()
    .required('Please pick a date')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  visitTime: Yup.string().required('Please pick a time slot'),
  visitType: Yup.string()
    .oneOf(['personal', 'family', 'banker'], 'Invalid type')
    .required('Choose a visit type'),
  visitorCount: Yup.number().min(1).max(6).required(),
  specialNeeds: Yup.string().max(300, 'Max 300 characters').nullable(),
  preferredLang: Yup.string()
    .oneOf(['hindi', 'english', 'marathi'])
    .required('Choose a language'),
});

const LANGS = [
  { value: 'hindi',   label: 'हिन्दी (Hindi)' },
  { value: 'english', label: 'English' },
  { value: 'marathi', label: 'मराठी (Marathi)' },
];

export default function BookVisitSheet({ visible, projectId, onClose, onBooked, rescheduleVisit: target }) {
  const dispatch = useDispatch();
  const { slots, slotsLoading, bookBusy, rescheduleBusy } = useSelector(s => s.siteVisit);
  const [dateError, setDateError] = useState(null);

  const isReschedule = !!target;
  const busy = isReschedule ? rescheduleBusy : bookBusy;

  const defaults = () => ({
    visitDate: minBookableDate(),
    visitTime: '',
    visitType: 'personal',
    visitorCount: 1,
    specialNeeds: '',
    preferredLang: 'hindi',
  });

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: defaults(),
  });

  const date = watch('visitDate');

  useEffect(() => {
    if (!visible) return;
    const ok = validateVisitDate(date);
    if (!ok.ok) {
      setDateError(ok.reason);
      dispatch(clearSlots());
      setValue('visitTime', '');
      return;
    }
    setDateError(null);
    dispatch(loadSlots({ projectId, date }));
    setValue('visitTime', '');
  }, [visible, date, projectId, dispatch, setValue]);

  useEffect(() => {
    if (visible) reset(defaults());
  }, [visible, reset]);

  const submit = async data => {
    try {
      if (isReschedule) {
        const result = await dispatch(rescheduleVisit({
          visitId: target.id,
          visitDate: data.visitDate,
          visitTime: data.visitTime,
        })).unwrap();
        showToast('success', 'Rescheduled!', `Visit moved to ${data.visitDate} at ${data.visitTime}.`);
        onBooked?.(result);
        onClose();
        return;
      }
      const result = await dispatch(bookVisit({
        projectId,
        visitDate: data.visitDate,
        visitTime: data.visitTime,
        visitType: data.visitType,
        visitorCount: data.visitorCount,
        specialNeeds: data.specialNeeds || undefined,
        preferredLang: data.preferredLang,
      })).unwrap();
      showToast(
        'success',
        'Booked!',
        `Site visit confirmed for ${data.visitDate} at ${data.visitTime}. Confirmation: ${result.confirmationCode}`,
      );
      onBooked?.(result);
      onClose();
    } catch (e) {
      showToast('error', isReschedule ? 'Could not reschedule' : 'Could not book', String(e));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={typography.h2}>{isReschedule ? 'Reschedule Visit' : 'Book a Site Visit'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Date */}
            <Controller
              control={control}
              name="visitDate"
              render={({ field: { value, onChange } }) => (
                <Input
                  label="Visit date"
                  value={value}
                  onChangeText={onChange}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numbers-and-punctuation"
                  autoCorrect={false}
                  error={errors.visitDate?.message || dateError}
                  hint={!dateError ? 'Min: tomorrow, no Sundays / holidays' : null}
                />
              )}
            />

            {/* Slots */}
            <View style={{ marginBottom: spacing.md }}>
              <Text style={typography.label}>Time slot</Text>
              {slotsLoading ? (
                <ActivityIndicator color={palette.primary} style={{ marginTop: spacing.sm }} />
              ) : slots.blackedOut || slots.blocked ? (
                <Text style={styles.slotBlocked}>{slots.reason || 'This date is blocked.'}</Text>
              ) : slots.slots?.length === 0 ? (
                <Text style={styles.slotBlocked}>No slots configured for this date.</Text>
              ) : (
                <Controller
                  control={control}
                  name="visitTime"
                  render={({ field: { value, onChange } }) => (
                    <View style={styles.slotGrid}>
                      {slots.slots.map(s => {
                        const t = s.slotTime.slice(0, 5);
                        const selected = value === t;
                        return (
                          <TouchableOpacity
                            key={s.slotId}
                            disabled={s.isFull}
                            onPress={() => onChange(t)}
                            style={[
                              styles.slotChip,
                              selected && styles.slotChipActive,
                              s.isFull && styles.slotChipFull,
                            ]}
                          >
                            <Text style={[
                              styles.slotText,
                              selected && styles.slotTextActive,
                              s.isFull && styles.slotTextFull,
                            ]}>
                              {to12h(t)}
                            </Text>
                            <Text style={[
                              styles.slotMeta,
                              selected && { color: '#fff' },
                              s.isFull && { color: palette.error },
                            ]}>
                              {s.isFull ? 'Full' : `${s.available} left`}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                />
              )}
              {errors.visitTime ? <Text style={styles.err}>{errors.visitTime.message}</Text> : null}
            </View>

            {/* Visit type / count / needs / language — only when booking fresh */}
            {!isReschedule ? (
              <>
                <Controller
                  control={control}
                  name="visitType"
                  render={({ field: { value, onChange } }) => (
                    <RadioGroup
                      label="Visit type"
                      value={value}
                      onChange={onChange}
                      direction="column"
                      options={[
                        { value: 'personal', label: 'Personal' },
                        { value: 'family',   label: 'With family' },
                        { value: 'banker',   label: 'With banker' },
                      ]}
                      error={errors.visitType?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="visitorCount"
                  render={({ field: { value, onChange } }) => (
                    <Stepper
                      label="Number of visitors"
                      value={value}
                      onChange={onChange}
                      min={1}
                      max={6}
                      suffix={value === 1 ? 'person' : 'persons'}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="specialNeeds"
                  render={({ field: { value, onChange } }) => (
                    <Input
                      label="Special needs (optional)"
                      value={value}
                      onChangeText={onChange}
                      multiline
                      numberOfLines={3}
                      maxLength={300}
                      placeholder="Wheelchair, senior citizen, dietary needs…"
                      error={errors.specialNeeds?.message}
                      hint={`${(value || '').length} / 300`}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="preferredLang"
                  render={({ field: { value, onChange } }) => (
                    <Dropdown
                      label="Preferred language"
                      value={value}
                      options={LANGS}
                      onChange={onChange}
                      error={errors.preferredLang?.message}
                    />
                  )}
                />
              </>
            ) : null}

            <Button
              title={busy ? 'Saving…' : isReschedule ? 'Confirm Reschedule' : 'Confirm Booking'}
              onPress={handleSubmit(submit)}
              loading={busy}
              style={{ marginTop: spacing.md }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function to12h(t24) {
  const [hh, mm] = t24.split(':').map(Number);
  const period = hh >= 12 ? 'PM' : 'AM';
  const hh12 = ((hh + 11) % 12) + 1;
  return `${hh12}:${String(mm).padStart(2, '0')} ${period}`;
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

  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 6 },
  slotChip: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: radius.md, borderWidth: 1, borderColor: palette.border,
    backgroundColor: palette.surface,
    marginRight: spacing.sm, marginBottom: spacing.sm,
    minWidth: 100, alignItems: 'center',
  },
  slotChipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  slotChipFull: { backgroundColor: palette.surfaceAlt, opacity: 0.6 },
  slotText: { fontSize: 13, fontWeight: '700', color: palette.text },
  slotTextActive: { color: '#fff' },
  slotTextFull: { color: palette.textMuted },
  slotMeta: { fontSize: 10, color: palette.textMuted, marginTop: 2 },
  slotBlocked: { color: palette.error, marginTop: spacing.sm, fontSize: 13 },
  err: { color: palette.error, fontSize: 12, marginTop: 4 },
});
