import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';

import Input from './Input';
import Button from './Button';
import RadioGroup from './RadioGroup';
import Stepper from './Stepper';
import { palette, spacing, typography } from '../theme';
import { bookAid } from '../store/slices/mobilitySlice';
import { computeTotal } from '../utils/mobilityCost';
import { showToast } from '../utils/toastConfig';

function todayIso() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10);
}

const schema = Yup.object().shape({
  mode: Yup.string().oneOf(['rent', 'buy']).required(),
  startDate: Yup.string().required('Pick a date').matches(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  days: Yup.number().min(1).max(180).required(),
  withAttendant: Yup.boolean(),
  deliveryNote: Yup.string().max(150).nullable(),
});

const defaults = () => ({ mode: 'rent', startDate: todayIso(), days: 7, withAttendant: false, deliveryNote: '' });

export default function MobilityBookingSheet({ visible, aid, onClose, onBooked }) {
  const dispatch = useDispatch();
  const { bookBusy } = useSelector(s => s.mobility);

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: defaults(),
  });

  useEffect(() => { if (visible) reset(defaults()); }, [visible, reset]);

  const mode = watch('mode');
  const days = watch('days');
  const withAttendant = watch('withAttendant');
  const note = watch('deliveryNote') || '';
  const total = aid ? computeTotal(aid, { mode, days, withAttendant }) : 0;

  const submit = async data => {
    try {
      const res = await dispatch(bookAid({
        aidId: aid.id,
        mode: data.mode,
        startDate: data.startDate,
        days: data.mode === 'rent' ? data.days : 1,
        withAttendant: data.withAttendant,
        deliveryNote: data.deliveryNote || undefined,
      })).unwrap();
      showToast('success', data.mode === 'buy' ? 'Purchased!' : 'Booked!', `${aid.name} · ₹${res.total}.`);
      onBooked?.();
      onClose();
    } catch (e) {
      showToast('error', 'Could not book', String(e));
    }
  };

  if (!aid) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={typography.h2}>{aid.name}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}><Text style={styles.close}>×</Text></TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={typography.caption}>
              Rent ₹{aid.rentPerDay}/day{aid.buyPrice ? ` · Buy ₹${aid.buyPrice}` : ''}
            </Text>

            <Controller control={control} name="mode" render={({ field: { value, onChange } }) => (
              <RadioGroup
                label="Rent or buy?"
                value={value}
                onChange={onChange}
                options={[
                  { value: 'rent', label: 'Rent' },
                  ...(aid.buyPrice ? [{ value: 'buy', label: 'Buy' }] : []),
                ]}
                error={errors.mode?.message}
              />
            )} />

            <Controller control={control} name="startDate" render={({ field: { value, onChange } }) => (
              <Input label={mode === 'buy' ? 'Delivery date' : 'Start date'} value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCorrect={false} error={errors.startDate?.message} hint="Today or later" />
            )} />

            {mode === 'rent' ? (
              <Controller control={control} name="days" render={({ field: { value, onChange } }) => (
                <Stepper label="Rental duration" value={value} onChange={onChange} min={1} max={180} suffix={value === 1 ? 'day' : 'days'} />
              )} />
            ) : null}

            {aid.attendantAvailable ? (
              <Controller control={control} name="withAttendant" render={({ field: { value, onChange } }) => (
                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchLabel}>Trained attendant?</Text>
                    <Text style={typography.caption}>₹300/day extra</Text>
                  </View>
                  <Switch value={value} onValueChange={onChange} trackColor={{ true: palette.primary, false: palette.border }} thumbColor="#fff" />
                </View>
              )} />
            ) : null}

            <Controller control={control} name="deliveryNote" render={({ field: { value, onChange } }) => (
              <Input label="Delivery note (optional)" value={value} onChangeText={onChange} maxLength={150} placeholder="Floor, landmark, call on arrival…" hint={`${note.length} / 150`} />
            )} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{total}</Text>
            </View>

            <Button title={bookBusy ? 'Booking…' : mode === 'buy' ? 'Confirm Purchase' : 'Confirm Rental'} onPress={handleSubmit(submit)} loading={bookBusy} />
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
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, marginBottom: spacing.sm },
  switchLabel: { fontSize: 14, fontWeight: '600', color: palette.text },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: palette.divider, marginTop: spacing.sm, marginBottom: spacing.sm },
  totalLabel: { fontSize: 15, fontWeight: '700', color: palette.text },
  totalValue: { fontSize: 20, fontWeight: '800', color: palette.primary },
});
