import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';

import Input from './Input';
import Button from './Button';
import Stepper from './Stepper';
import { palette, radius, spacing, typography } from '../theme';
import { loadAmenitySlots, bookAmenity, clearAmenitySlots } from '../store/slices/communitySlice';
import { showToast } from '../utils/toastConfig';

function tomorrowIso() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10);
}

// Per-category form variants — fields, labels and add-ons differ by facility type.
const VARIANTS = {
  HALL: {
    slotLabel: '2-hour slots', countLabel: 'Expected guests', countDefault: 50,
    purposeLabel: 'Occasion', purposePlaceholder: 'Birthday / Reception / Meeting / Festival…', purposeRequired: true,
    extrasLabel: 'Add-on services',
    extras: [
      { value: 'sound_system', label: 'Sound system' },
      { value: 'projector', label: 'Projector' },
      { value: 'catering', label: 'Catering' },
      { value: 'decoration', label: 'Decoration' },
    ],
  },
  LAWN: {
    slotLabel: '2-hour slots', countLabel: 'Expected guests', countDefault: 100,
    purposeLabel: 'Occasion', purposePlaceholder: 'Sangeet / Reception / Festival…', purposeRequired: true,
    extrasLabel: 'Add-on services',
    extras: [
      { value: 'sound_system', label: 'Sound system' },
      { value: 'tent', label: 'Tent / Shamiana' },
      { value: 'lighting', label: 'Decorative lighting' },
      { value: 'catering', label: 'Catering' },
    ],
  },
  YOGA: {
    slotLabel: 'Session slots', countLabel: 'Participants', countDefault: 5,
    purposeLabel: 'Activity', purposePlaceholder: 'Yoga / Meditation / Aerobics…', purposeRequired: false,
    extrasLabel: 'Add-ons',
    extras: [
      { value: 'instructor', label: 'Personal instructor' },
      { value: 'mats', label: 'Extra mats' },
    ],
  },
  POOL: {
    slotLabel: 'Pool slots', countLabel: 'Swimmers', countDefault: 4,
    purposeLabel: 'Purpose', purposePlaceholder: 'Open swim / Coaching / Pool party…', purposeRequired: false,
    extrasLabel: 'Add-ons',
    extras: [
      { value: 'coach', label: 'Swim coach' },
      { value: 'towels', label: 'Towels' },
      { value: 'pool_toys', label: 'Pool toys' },
    ],
  },
  TENNIS: {
    slotLabel: 'Court slots', countLabel: 'Players', countDefault: 2,
    purposeLabel: 'Match type', purposePlaceholder: 'Practice / Singles / Doubles…', purposeRequired: false,
    extrasLabel: 'Equipment',
    extras: [
      { value: 'racket', label: 'Racket rental' },
      { value: 'balls', label: 'Ball set' },
      { value: 'coach', label: 'Coach' },
    ],
  },
};
const DEFAULT_VARIANT = VARIANTS.HALL;
const variantFor = amenity => VARIANTS[amenity?.categoryCode] || DEFAULT_VARIANT;

// `occasion` is validated per-variant in the submit handler (optional here).
const schema = Yup.object().shape({
  bookingDate: Yup.string().required('Pick a date').matches(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  timeSlot: Yup.string().required('Pick a slot'),
  occasion: Yup.string().max(100),
  guestCount: Yup.number().min(1).required(),
  extraServices: Yup.array(),
  terms: Yup.boolean().oneOf([true], 'Please accept the usage rules'),
});

const defaults = (variant = DEFAULT_VARIANT) => ({ bookingDate: tomorrowIso(), timeSlot: '', occasion: '', guestCount: variant.countDefault, extraServices: [], terms: false });

export default function AmenityBookingSheet({ visible, amenity, onClose, onBooked }) {
  const dispatch = useDispatch();
  const { amenitySlots, slotsLoading, bookBusy } = useSelector(s => s.community);

  const variant = variantFor(amenity);

  const { control, handleSubmit, reset, watch, setValue, setError, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: defaults(variant),
  });

  const date = watch('bookingDate');

  useEffect(() => { if (visible) reset(defaults(variant)); }, [visible, reset, variant]);

  useEffect(() => {
    if (!visible || !amenity) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { dispatch(clearAmenitySlots()); return; }
    dispatch(loadAmenitySlots({ amenityId: amenity.id, date }));
    setValue('timeSlot', '');
  }, [visible, date, amenity, dispatch, setValue]);

  const submit = async data => {
    if (variant.purposeRequired && !data.occasion?.trim()) {
      setError('occasion', { message: `Enter the ${variant.purposeLabel.toLowerCase()}` });
      return;
    }
    try {
      const res = await dispatch(bookAmenity({
        amenityId: amenity.id,
        bookingDate: data.bookingDate,
        timeSlot: data.timeSlot,
        occasion: data.occasion?.trim() || variant.purposeLabel,
        extraServices: data.extraServices,
        guestCount: data.guestCount,
        terms: true,
      })).unwrap();
      showToast(
        'success',
        `${amenity.name} booked!`,
        res.deposit > 0 ? `Deposit of ₹${res.deposit} required to confirm. ${res.bookingCode}` : `Booking ID: ${res.bookingCode}`,
      );
      onBooked?.();
      onClose();
    } catch (e) {
      showToast('error', 'Could not book', String(e));
    }
  };

  if (!amenity) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={typography.h2}>{amenity.icon} {amenity.name}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}><Text style={styles.close}>×</Text></TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={typography.caption}>
              Capacity {amenity.capacity}{amenity.deposit > 0 ? ` · Deposit ₹${amenity.deposit}` : ' · No deposit'}
            </Text>

            <Controller control={control} name="bookingDate" render={({ field: { value, onChange } }) => (
              <Input label="Date" value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCorrect={false} error={errors.bookingDate?.message} hint="Tomorrow to +30 days" />
            )} />

            <View style={{ marginBottom: spacing.md }}>
              <Text style={typography.label}>{variant.slotLabel}</Text>
              {slotsLoading ? (
                <ActivityIndicator color={palette.primary} style={{ marginTop: spacing.sm }} />
              ) : amenitySlots.length === 0 ? (
                <Text style={styles.noSlot}>No slots (maintenance or fully booked). Try another date.</Text>
              ) : (
                <Controller control={control} name="timeSlot" render={({ field: { value, onChange } }) => (
                  <View style={styles.slotRow}>
                    {amenitySlots.map(s => {
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

            <Controller control={control} name="occasion" render={({ field: { value, onChange } }) => (
              <Input label={variant.purposeRequired ? variant.purposeLabel : `${variant.purposeLabel} (optional)`} value={value} onChangeText={onChange} maxLength={100} placeholder={variant.purposePlaceholder} error={errors.occasion?.message} />
            )} />

            <Controller control={control} name="guestCount" render={({ field: { value, onChange } }) => (
              <Stepper label={variant.countLabel} value={value} onChange={onChange} min={1} max={amenity.capacity} suffix={`/ ${amenity.capacity}`} />
            )} />

            <Text style={typography.label}>{variant.extrasLabel}</Text>
            <Controller control={control} name="extraServices" render={({ field: { value, onChange } }) => (
              <View style={styles.chipWrap}>
                {variant.extras.map(x => {
                  const sel = value.includes(x.value);
                  return (
                    <TouchableOpacity key={x.value} style={[styles.chip, sel && styles.chipActive]} onPress={() => onChange(sel ? value.filter(v => v !== x.value) : [...value, x.value])}>
                      <Text style={[styles.chipText, sel && styles.chipTextActive]}>{x.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )} />

            <Controller control={control} name="terms" render={({ field: { value, onChange } }) => (
              <TouchableOpacity style={styles.termsRow} onPress={() => onChange(!value)} activeOpacity={0.7}>
                <View style={[styles.checkbox, value && styles.checkboxOn]}>
                  {value ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
                <Text style={styles.termsText}>I agree to facility usage rules and refund policy</Text>
              </TouchableOpacity>
            )} />
            {errors.terms ? <Text style={styles.err}>{errors.terms.message}</Text> : null}

            <Button title={bookBusy ? 'Booking…' : 'Book Facility'} onPress={handleSubmit(submit)} loading={bookBusy} style={{ marginTop: spacing.md }} />
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
  slot: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.md, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, marginRight: spacing.sm, marginBottom: spacing.sm },
  slotActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  slotText: { fontSize: 12, fontWeight: '700', color: palette.text },
  slotTextActive: { color: '#fff' },
  noSlot: { color: palette.error, marginTop: spacing.sm, fontSize: 13 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 6, marginBottom: spacing.md },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, marginRight: spacing.sm, marginBottom: spacing.sm },
  chipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: palette.text },
  chipTextActive: { color: '#fff' },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: palette.border, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  checkboxOn: { backgroundColor: palette.primary, borderColor: palette.primary },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '800' },
  termsText: { flex: 1, fontSize: 13, color: palette.text },
  err: { color: palette.error, fontSize: 12, marginTop: 4 },
});
