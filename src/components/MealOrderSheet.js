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
import { palette, radius, spacing, typography } from '../theme';
import { placeOrder, subscribe } from '../store/slices/mealSlice';
import { showToast } from '../utils/toastConfig';
import { MEAL_TYPES, DIET_TYPES, mealLabel, dietLabel } from '../utils/mealOptions';

function minMealDate(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

const schema = Yup.object().shape({
  mealDate: Yup.string().required('Pick a date').matches(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  mealType: Yup.array().min(1, 'Pick at least one meal').required(),
  dietType: Yup.string().oneOf(DIET_TYPES).required('Choose a diet'),
  persons: Yup.number().min(1).max(10).required(),
  plan: Yup.string().oneOf(['none', 'daily', 'weekly', 'monthly']).required(),
  deliveryNote: Yup.string().max(150, 'Max 150 characters').nullable(),
});

const defaults = () => ({
  mealDate: minMealDate(), mealType: ['lunch'], dietType: 'satvik', persons: 1, plan: 'none', deliveryNote: '',
});

const PLAN_OPTIONS = [
  { value: 'none', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function MealOrderSheet({ visible, onClose, onDone }) {
  const dispatch = useDispatch();
  const { orderBusy, subscribeBusy } = useSelector(s => s.meal);
  const busy = orderBusy || subscribeBusy;

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: defaults(),
  });

  useEffect(() => { if (visible) reset(defaults()); }, [visible, reset]);

  const note = watch('deliveryNote') || '';
  const plan = watch('plan');

  const submit = async data => {
    try {
      if (data.plan === 'none') {
        await dispatch(placeOrder({
          mealDate: data.mealDate, mealType: data.mealType, dietType: data.dietType,
          persons: data.persons, deliveryNote: data.deliveryNote || undefined,
        })).unwrap();
        showToast('success', 'Order placed!', `Meals for ${data.mealDate} confirmed.`);
      } else {
        await dispatch(subscribe({
          plan: data.plan, dietType: data.dietType, persons: data.persons, startDate: data.mealDate,
        })).unwrap();
        showToast('success', 'Subscribed!', `${data.plan} tiffin starts ${data.mealDate}.`);
      }
      onDone?.();
      onClose();
    } catch (e) {
      showToast('error', 'Could not complete', String(e));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={typography.h2}>Order Meals</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}><Text style={styles.close}>×</Text></TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Controller
              control={control}
              name="mealDate"
              render={({ field: { value, onChange } }) => (
                <Input
                  label={plan === 'none' ? 'Delivery date' : 'Start date'}
                  value={value}
                  onChangeText={onChange}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numbers-and-punctuation"
                  autoCorrect={false}
                  error={errors.mealDate?.message}
                  hint="Min: tomorrow"
                />
              )}
            />

            <Text style={typography.label}>Meals</Text>
            <Controller
              control={control}
              name="mealType"
              render={({ field: { value, onChange } }) => (
                <View style={styles.chipWrap}>
                  {MEAL_TYPES.map(m => {
                    const sel = value.includes(m);
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[styles.chip, sel && styles.chipActive]}
                        onPress={() => onChange(sel ? value.filter(x => x !== m) : [...value, m])}
                      >
                        <Text style={[styles.chipText, sel && styles.chipTextActive]}>{mealLabel(m)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            />
            {errors.mealType ? <Text style={styles.err}>{errors.mealType.message}</Text> : null}

            <Controller
              control={control}
              name="dietType"
              render={({ field: { value, onChange } }) => (
                <RadioGroup
                  label="Diet"
                  value={value}
                  onChange={onChange}
                  options={DIET_TYPES.map(d => ({ value: d, label: dietLabel(d) }))}
                  error={errors.dietType?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="persons"
              render={({ field: { value, onChange } }) => (
                <Stepper label="Persons" value={value} onChange={onChange} min={1} max={10} suffix={value === 1 ? 'person' : 'persons'} />
              )}
            />

            <Controller
              control={control}
              name="plan"
              render={({ field: { value, onChange } }) => (
                <RadioGroup label="Plan" value={value} onChange={onChange} options={PLAN_OPTIONS} error={errors.plan?.message} />
              )}
            />

            <Controller
              control={control}
              name="deliveryNote"
              render={({ field: { value, onChange } }) => (
                <Input
                  label="Delivery note (optional)"
                  value={value}
                  onChangeText={onChange}
                  maxLength={150}
                  placeholder="Leave at door / Hand delivery / Gate security"
                  error={errors.deliveryNote?.message}
                  hint={`${note.length} / 150`}
                />
              )}
            />

            <Button
              title={busy ? 'Submitting…' : plan === 'none' ? 'Place Order' : 'Activate Subscription'}
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

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: palette.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, paddingBottom: spacing.xxl, maxHeight: '92%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  close: { fontSize: 26, color: palette.textMuted },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 6, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill,
    borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface,
    marginRight: spacing.sm, marginBottom: spacing.sm,
  },
  chipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: palette.text },
  chipTextActive: { color: '#fff' },
  err: { color: palette.error, fontSize: 12, marginTop: 4, marginBottom: spacing.sm },
});
