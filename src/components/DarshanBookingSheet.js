import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';

import Input from './Input';
import Button from './Button';
import RadioGroup from './RadioGroup';
import Dropdown from './Dropdown';
import Stepper from './Stepper';
import { palette, radius, spacing, typography } from '../theme';
import { bookDarshan } from '../store/slices/templeSlice';
import { showToast } from '../utils/toastConfig';

function todayIso() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10);
}

const SLOTS = [
  { value: 'morning', label: 'Morning aarti' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening aarti' },
];
const TRANSPORT = [
  { value: 'shared_shuttle', label: 'Shared Shuttle' },
  { value: 'private_taxi', label: 'Private Taxi' },
  { value: 'e_rickshaw', label: 'E-Rickshaw' },
  { value: 'walking_group', label: 'Walking Group' },
];
const PUJAS = [
  { value: 'abhishek', label: 'Abhishek' },
  { value: 'bhog', label: 'Bhog' },
  { value: 'seva', label: 'Seva' },
];

const schema = Yup.object().shape({
  visitDate: Yup.string().required('Pick a date').matches(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  visitTimeSlot: Yup.string().oneOf(['morning', 'afternoon', 'evening']).required(),
  transportType: Yup.string().required('Choose transport'),
  persons: Yup.number().min(1).max(20).required(),
  seniorCitizens: Yup.number().min(0).max(20),
  groupName: Yup.string().max(100).nullable(),
  specialPujaOn: Yup.boolean(),
  specialPuja: Yup.string().nullable(),
  isVip: Yup.boolean(),
});

const defaults = (templeIds = []) => () => ({
  templeIds, visitDate: todayIso(), visitTimeSlot: 'morning', transportType: 'shared_shuttle',
  persons: 2, seniorCitizens: 0, groupName: '', specialPujaOn: false, specialPuja: 'abhishek', isVip: false,
});

export default function DarshanBookingSheet({ visible, temples = [], preselect, onClose, onBooked }) {
  const dispatch = useDispatch();
  const { bookBusy } = useSelector(s => s.temple);

  const makeDefaults = defaults(preselect ? [preselect.id] : []);
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: makeDefaults(),
  });

  useEffect(() => { if (visible) reset(makeDefaults()); }, [visible, preselect, reset]); // eslint-disable-line react-hooks/exhaustive-deps

  const templeIds = watch('templeIds');
  const persons = watch('persons');
  const pujaOn = watch('specialPujaOn');
  const isVip = watch('isVip');
  const canVip = temples.some(t => templeIds.includes(t.id) && t.vipAvailable);

  const submit = async data => {
    if (!data.templeIds.length) { showToast('error', 'Select temples', 'Pick at least one temple.'); return; }
    if (data.seniorCitizens > data.persons) { showToast('error', 'Check seniors', 'Seniors cannot exceed pilgrims.'); return; }
    try {
      const res = await dispatch(bookDarshan({
        payload: {
          templeIds: data.templeIds,
          visitDate: data.visitDate,
          visitTimeSlot: data.visitTimeSlot,
          transportType: data.transportType,
          persons: data.persons,
          seniorCitizens: data.seniorCitizens,
          groupName: data.groupName || undefined,
          specialPuja: data.specialPujaOn ? data.specialPuja : undefined,
        },
        isVip: data.isVip && canVip,
      })).unwrap();
      showToast('success', res.isVip ? 'VIP darshan confirmed' : 'Darshan booked!', `Ref ${res.bookingCode}`);
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
            <Text style={typography.h2}>Darshan & Transport</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}><Text style={styles.close}>×</Text></TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={typography.label}>Select temples</Text>
            <Controller control={control} name="templeIds" render={({ field: { value, onChange } }) => (
              <View style={styles.chipWrap}>
                {temples.map(t => {
                  const sel = value.includes(t.id);
                  return (
                    <TouchableOpacity key={t.id} style={[styles.chip, sel && styles.chipActive]} onPress={() => onChange(sel ? value.filter(x => x !== t.id) : [...value, t.id])}>
                      <Text style={[styles.chipText, sel && styles.chipTextActive]}>{t.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )} />

            <Controller control={control} name="visitDate" render={({ field: { value, onChange } }) => (
              <Input label="Date" value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCorrect={false} error={errors.visitDate?.message} hint="Same day allowed" />
            )} />

            <Controller control={control} name="visitTimeSlot" render={({ field: { value, onChange } }) => (
              <RadioGroup label="Time" value={value} onChange={onChange} options={SLOTS} error={errors.visitTimeSlot?.message} />
            )} />

            <Controller control={control} name="transportType" render={({ field: { value, onChange } }) => (
              <RadioGroup label="Transport" value={value} onChange={onChange} direction="column" options={TRANSPORT} error={errors.transportType?.message} />
            )} />

            <Controller control={control} name="persons" render={({ field: { value, onChange } }) => (
              <Stepper label="Pilgrims" value={value} onChange={onChange} min={1} max={20} suffix={value === 1 ? 'person' : 'persons'} />
            )} />
            <Controller control={control} name="seniorCitizens" render={({ field: { value, onChange } }) => (
              <Stepper label="Senior citizens (assisted)" value={value} onChange={onChange} min={0} max={persons} suffix="seniors" />
            )} />

            <Controller control={control} name="groupName" render={({ field: { value, onChange } }) => (
              <Input label="Group / family name (optional)" value={value} onChangeText={onChange} maxLength={100} placeholder="e.g. Sharma family" />
            )} />

            <Controller control={control} name="specialPujaOn" render={({ field: { value, onChange } }) => (
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Special puja?</Text>
                <Switch value={value} onValueChange={onChange} trackColor={{ true: palette.primary, false: palette.border }} thumbColor="#fff" />
              </View>
            )} />
            {pujaOn ? (
              <Controller control={control} name="specialPuja" render={({ field: { value, onChange } }) => (
                <Dropdown label="Puja type" value={value} options={PUJAS} onChange={onChange} />
              )} />
            ) : null}

            {canVip ? (
              <Controller control={control} name="isVip" render={({ field: { value, onChange } }) => (
                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchLabel}>VIP darshan</Text>
                    <Text style={typography.caption}>Skip-the-line token (where available)</Text>
                  </View>
                  <Switch value={value} onValueChange={onChange} trackColor={{ true: palette.accent, false: palette.border }} thumbColor="#fff" />
                </View>
              )} />
            ) : null}

            <Button title={bookBusy ? 'Booking…' : isVip && canVip ? 'Book VIP Darshan' : 'Book Darshan'} onPress={handleSubmit(submit)} loading={bookBusy} style={{ marginTop: spacing.md }} />
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
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 6, marginBottom: spacing.md },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, marginRight: spacing.sm, marginBottom: spacing.sm },
  chipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: palette.text },
  chipTextActive: { color: '#fff' },
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, marginBottom: spacing.sm },
  switchLabel: { fontSize: 14, fontWeight: '600', color: palette.text },
});
