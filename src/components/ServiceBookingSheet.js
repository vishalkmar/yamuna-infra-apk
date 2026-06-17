import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';

import Input from './Input';
import Button from './Button';
import RadioGroup from './RadioGroup';
import Stepper from './Stepper';
import CashfreeCheckout from './CashfreeCheckout';
import { palette, radius, spacing, typography } from '../theme';
import { bookService } from '../store/slices/servicesSlice';
import { paymentApi } from '../api/paymentApi';
import { formatINR } from '../utils/format';
import { showToast } from '../utils/toastConfig';
import { MEAL_TYPES, DIET_TYPES, mealLabel, dietLabel } from '../utils/cookOptions';

const FREQUENCIES = [
  { value: 'one_time', label: 'One-time' },
  { value: 'daily',    label: 'Daily' },
  { value: 'weekly',   label: 'Weekly' },
  { value: 'monthly',  label: 'Monthly' },
];
const TIME_SLOTS = [
  { value: 'morning',   label: 'Morning (8–10 AM)' },
  { value: 'afternoon', label: 'Afternoon (12–2 PM)' },
  { value: 'evening',   label: 'Evening (5–7 PM)' },
];
const GENDER_PREFS = [
  { value: 'any',    label: 'No preference' },
  { value: 'male',   label: 'Male' },
  { value: 'female', label: 'Female' },
];

function minStartDate(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

const schema = Yup.object().shape({
  frequency: Yup.string().oneOf(FREQUENCIES.map(f => f.value)).required('Choose a frequency'),
  startDate: Yup.string().required('Pick a start date').matches(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  preferredTime: Yup.string().oneOf(TIME_SLOTS.map(t => t.value)).required('Pick a time'),
  specialNotes: Yup.string().max(300, 'Max 300 characters').nullable(),
  genderPref: Yup.string().oneOf(GENDER_PREFS.map(g => g.value)).required(),
});

const defaults = () => ({
  frequency: 'one_time', startDate: minStartDate(), preferredTime: 'morning', specialNotes: '', genderPref: 'any',
  // cook-only
  meals: ['lunch', 'dinner'], dietType: 'veg', persons: 2,
});

export default function ServiceBookingSheet({ visible, category, categoryLabel, provider, offering, onClose, onBooked }) {
  const dispatch = useDispatch();
  const { bookBusy } = useSelector(s => s.services);
  const isCook = category === 'cook';
  const amount = offering?.price || provider?.priceFrom || 0;

  const [order, setOrder] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: defaults(),
  });

  useEffect(() => { if (visible) { reset(defaults()); setOrder(null); setCheckoutOpen(false); } }, [visible, reset]);

  const notes = watch('specialNotes') || '';

  const submit = async data => {
    try {
      const res = await dispatch(bookService({
        category,
        providerId: provider?.id,
        offeringName: offering?.name,
        amount,
        frequency: data.frequency,
        startDate: data.startDate,
        preferredTime: data.preferredTime,
        specialNotes: data.specialNotes || undefined,
        genderPref: data.genderPref,
        ...(isCook ? { meals: data.meals, dietType: data.dietType, persons: data.persons } : {}),
      })).unwrap();

      // Wherever there's a price, take payment via Cashfree (test/sandbox).
      if (amount > 0) {
        setPaying(true);
        const ord = await paymentApi.initiate({
          serviceBookingId: res.id,
          amount,
          mode: 'cashfree',
          remarks: `${categoryLabel}${offering ? ' – ' + offering.name : ''}`,
        });
        setPaying(false);
        setOrder(ord);
        setCheckoutOpen(true);
      } else {
        showToast('success', 'Booked!', `${categoryLabel} scheduled for ${data.startDate}.`);
        onBooked?.();
        onClose();
      }
    } catch (e) {
      setPaying(false);
      showToast('error', 'Could not book', String(e));
    }
  };

  const onPaid = async () => {
    setCheckoutOpen(false);
    try {
      const r = await paymentApi.verify(order?.orderId);
      if (r?.status === 'paid') {
        showToast('success', 'Payment received', `${categoryLabel} confirmed. Receipt ${r.receiptCode || ''}`.trim());
      } else {
        showToast('warning', 'Booked — payment pending', 'We are confirming your payment.');
      }
    } catch (e) {
      showToast('warning', 'Booked — payment pending', 'We could not confirm payment yet.');
    }
    onBooked?.();
    onClose();
  };

  const onPayCancel = () => {
    setCheckoutOpen(false);
    showToast('warning', 'Booked — payment pending', 'You can pay later from your bookings.');
    onBooked?.();
    onClose();
  };

  return (
    <>
    <CashfreeCheckout visible={checkoutOpen} order={order} onClose={onPayCancel} onSuccess={onPaid} onCancel={onPayCancel} />
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={typography.h2}>Book {categoryLabel}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}><Text style={styles.close}>×</Text></TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {provider ? (
              <View style={styles.providerBadge}>
                <Text style={styles.providerName}>{provider.name}</Text>
                {offering ? (
                  <Text style={styles.offeringLine}>{offering.name} · <Text style={styles.offeringPrice}>{formatINR(offering.price)}{offering.unit ? `/${offering.unit}` : ''}</Text></Text>
                ) : (
                  <Text style={typography.caption}>★ {provider.rating} · from ₹{provider.priceFrom}</Text>
                )}
              </View>
            ) : null}

            {/* Cook-specific options (Module 12) */}
            {isCook ? (
              <>
                <Text style={typography.label}>Meals to cook</Text>
                <Controller
                  control={control}
                  name="meals"
                  render={({ field: { value, onChange } }) => (
                    <View style={styles.mealRow}>
                      {MEAL_TYPES.map(m => {
                        const sel = value.includes(m);
                        return (
                          <TouchableOpacity
                            key={m}
                            style={[styles.mealChip, sel && styles.mealChipActive]}
                            onPress={() => onChange(sel ? value.filter(x => x !== m) : [...value, m])}
                          >
                            <Text style={[styles.mealText, sel && styles.mealTextActive]}>{mealLabel(m)}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                />

                <Controller
                  control={control}
                  name="dietType"
                  render={({ field: { value, onChange } }) => (
                    <RadioGroup
                      label="Diet preference"
                      value={value}
                      onChange={onChange}
                      options={DIET_TYPES.map(d => ({ value: d, label: dietLabel(d) }))}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="persons"
                  render={({ field: { value, onChange } }) => (
                    <Stepper label="Cooking for (persons)" value={value} onChange={onChange} min={1} max={20} suffix={value === 1 ? 'person' : 'persons'} />
                  )}
                />
              </>
            ) : null}

            <Controller
              control={control}
              name="frequency"
              render={({ field: { value, onChange } }) => (
                <RadioGroup label="How often?" value={value} onChange={onChange} options={FREQUENCIES} error={errors.frequency?.message} />
              )}
            />

            <Controller
              control={control}
              name="startDate"
              render={({ field: { value, onChange } }) => (
                <Input
                  label="Start date"
                  value={value}
                  onChangeText={onChange}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numbers-and-punctuation"
                  autoCorrect={false}
                  error={errors.startDate?.message}
                  hint="Min: tomorrow"
                />
              )}
            />

            <Controller
              control={control}
              name="preferredTime"
              render={({ field: { value, onChange } }) => (
                <RadioGroup label="Preferred time" value={value} onChange={onChange} direction="column" options={TIME_SLOTS} error={errors.preferredTime?.message} />
              )}
            />

            <Controller
              control={control}
              name="genderPref"
              render={({ field: { value, onChange } }) => (
                <RadioGroup label="Staff gender preference" value={value} onChange={onChange} options={GENDER_PREFS} error={errors.genderPref?.message} />
              )}
            />

            <Controller
              control={control}
              name="specialNotes"
              render={({ field: { value, onChange } }) => (
                <Input
                  label="Special notes (optional)"
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={3}
                  maxLength={300}
                  placeholder="Allergies, pets at home, specific instructions…"
                  error={errors.specialNotes?.message}
                  hint={`${notes.length} / 300`}
                />
              )}
            />

            <Button
              title={bookBusy || paying ? 'Please wait…' : amount > 0 ? `Pay ${formatINR(amount)} & Book` : 'Confirm Booking'}
              onPress={handleSubmit(submit)}
              loading={bookBusy || paying}
              style={{ marginTop: spacing.md }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
    </>
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
  providerBadge: {
    backgroundColor: palette.surfaceAlt, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.md,
  },
  providerName: { fontSize: 15, fontWeight: '700', color: palette.text },
  offeringLine: { fontSize: 13, color: palette.textMuted, marginTop: 2 },
  offeringPrice: { fontWeight: '800', color: palette.primary },

  mealRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 6, marginBottom: spacing.md },
  mealChip: {
    flex: 1, paddingVertical: 10, borderRadius: radius.md,
    borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, alignItems: 'center',
    marginRight: spacing.sm,
  },
  mealChipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  mealText: { fontSize: 13, fontWeight: '600', color: palette.text },
  mealTextActive: { color: '#fff' },
});
