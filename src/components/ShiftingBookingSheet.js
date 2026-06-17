import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';

import Input from './Input';
import Button from './Button';
import { palette, radius, spacing, typography } from '../theme';
import { bookShifting } from '../store/slices/moveInSlice';
import { showToast } from '../utils/toastConfig';

const ITEM_OPTIONS = [
  { value: 'furniture',   label: '🛋️ Furniture' },
  { value: 'electronics', label: '📺 Electronics' },
  { value: 'fragile',     label: '🍶 Fragile' },
  { value: 'vehicle',     label: '🚗 Vehicle' },
];

function minMoveDate(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 3);
  return d.toISOString().slice(0, 10);
}

const schema = Yup.object().shape({
  moveDate: Yup.string().required('Pick a moving date').matches(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  fromAddress: Yup.string().min(20, 'Min 20 characters').max(300).required('Enter your current address'),
  itemCategories: Yup.array().min(1, 'Select at least one').required(),
  packingRequired: Yup.boolean(),
  specialItems: Yup.string().max(200, 'Max 200 characters').nullable(),
});

function makeDefaults(toUnit) {
  return {
    moveDate: minMoveDate(),
    fromAddress: '',
    toUnit,
    itemCategories: [],
    packingRequired: false,
    specialItems: '',
  };
}

export default function ShiftingBookingSheet({ visible, toUnit, onClose, onBooked }) {
  const dispatch = useDispatch();
  const { shiftingBusy } = useSelector(s => s.movein);

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: makeDefaults(toUnit),
  });

  useEffect(() => { if (visible) reset(makeDefaults(toUnit)); }, [visible, toUnit, reset]);

  const special = watch('specialItems') || '';

  const submit = async data => {
    try {
      const result = await dispatch(bookShifting({
        moveDate: data.moveDate,
        fromAddress: data.fromAddress,
        toUnit: data.toUnit,
        itemCategories: data.itemCategories,
        packingRequired: data.packingRequired,
        specialItems: data.specialItems || undefined,
      })).unwrap();
      showToast('success', 'Shifting booked!', `${result.vendorName} will contact you 24h before your move.`);
      onBooked?.(result);
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
            <Text style={typography.h2}>Book Shifting</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}><Text style={styles.close}>×</Text></TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Controller
              control={control}
              name="moveDate"
              render={({ field: { value, onChange } }) => (
                <Input
                  label="Moving date"
                  value={value}
                  onChangeText={onChange}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numbers-and-punctuation"
                  autoCorrect={false}
                  error={errors.moveDate?.message}
                  hint="Min: 3 days from today"
                />
              )}
            />

            <Controller
              control={control}
              name="fromAddress"
              render={({ field: { value, onChange } }) => (
                <Input
                  label="Current address"
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={3}
                  placeholder="Flat / house, street, area, city, pincode…"
                  error={errors.fromAddress?.message}
                />
              )}
            />

            <Input label="Moving to" value={toUnit} editable={false} hint="Auto-filled from your booking" />

            {/* Item categories — multi-select */}
            <Text style={typography.label}>What are we moving?</Text>
            <Controller
              control={control}
              name="itemCategories"
              render={({ field: { value, onChange } }) => (
                <View style={styles.chipWrap}>
                  {ITEM_OPTIONS.map(opt => {
                    const selected = value.includes(opt.value);
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.chip, selected && styles.chipActive]}
                        onPress={() => onChange(selected ? value.filter(v => v !== opt.value) : [...value, opt.value])}
                      >
                        <Text style={[styles.chipText, selected && styles.chipTextActive]}>{opt.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            />
            {errors.itemCategories ? <Text style={styles.err}>{errors.itemCategories.message}</Text> : null}

            {/* Packing switch */}
            <Controller
              control={control}
              name="packingRequired"
              render={({ field: { value, onChange } }) => (
                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchLabel}>Need packing service?</Text>
                    <Text style={typography.caption}>Our team packs everything safely</Text>
                  </View>
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ true: palette.primary, false: palette.border }}
                    thumbColor="#fff"
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="specialItems"
              render={({ field: { value, onChange } }) => (
                <Input
                  label="Special items (optional)"
                  value={value}
                  onChangeText={onChange}
                  maxLength={200}
                  placeholder="Piano, heavy machinery, artwork…"
                  error={errors.specialItems?.message}
                  hint={`${special.length} / 200`}
                />
              )}
            />

            <Button
              title={shiftingBusy ? 'Booking…' : 'Confirm Shifting'}
              onPress={handleSubmit(submit)}
              loading={shiftingBusy}
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

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 6, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill,
    borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface,
    marginRight: spacing.sm, marginBottom: spacing.sm,
  },
  chipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: palette.text },
  chipTextActive: { color: '#fff' },

  switchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.sm, marginBottom: spacing.sm,
  },
  switchLabel: { fontSize: 14, fontWeight: '600', color: palette.text },
  err: { color: palette.error, fontSize: 12, marginTop: 4, marginBottom: spacing.sm },
});
