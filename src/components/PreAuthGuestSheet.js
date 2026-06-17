import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';

import Input from './Input';
import Button from './Button';
import Dropdown from './Dropdown';
import { palette, spacing, typography } from '../theme';
import { preAuthorize } from '../store/slices/communitySlice';
import { showToast } from '../utils/toastConfig';

function todayIso() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10);
}

const PURPOSES = [
  { value: 'personal', label: 'Personal' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'service', label: 'Service' },
  { value: 'medical', label: 'Medical' },
];

const schema = Yup.object().shape({
  guestName: Yup.string().min(3, 'Min 3 characters').required('Guest name required'),
  guestPhone: Yup.string().matches(/^[6-9]\d{9}$/, 'Valid 10-digit mobile').required('Phone required'),
  visitDate: Yup.string().required('Pick a date').matches(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  visitPurpose: Yup.string().oneOf(PURPOSES.map(p => p.value)).required('Choose purpose'),
  validTill: Yup.string().nullable().matches(/^\d{4}-\d{2}-\d{2}$/, { excludeEmptyString: true, message: 'Use YYYY-MM-DD' }),
  vehicleNo: Yup.string().max(15).nullable(),
});

const defaults = () => ({ guestName: '', guestPhone: '', visitDate: todayIso(), visitPurpose: 'personal', validTill: '', vehicleNo: '' });

export default function PreAuthGuestSheet({ visible, onClose, onDone }) {
  const dispatch = useDispatch();
  const { passBusy } = useSelector(s => s.community);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: defaults(),
  });

  useEffect(() => { if (visible) reset(defaults()); }, [visible, reset]);

  const submit = async data => {
    try {
      const res = await dispatch(preAuthorize({
        guestName: data.guestName, guestPhone: data.guestPhone, visitDate: data.visitDate,
        visitPurpose: data.visitPurpose, validTill: data.validTill || undefined, vehicleNo: data.vehicleNo || undefined,
      })).unwrap();
      showToast('success', 'Guest pass generated!', `QR sent to ${res.guestName} on WhatsApp.`);
      onDone?.();
      onClose();
    } catch (e) {
      showToast('error', 'Could not create pass', String(e));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={typography.h2}>Pre-authorize Guest</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}><Text style={styles.close}>×</Text></TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Controller control={control} name="guestName" render={({ field: { value, onChange } }) => (
              <Input label="Guest name" value={value} onChangeText={onChange} placeholder="Full name" error={errors.guestName?.message} />
            )} />
            <Controller control={control} name="guestPhone" render={({ field: { value, onChange } }) => (
              <Input label="Guest phone" value={value} onChangeText={onChange} keyboardType="number-pad" maxLength={10} placeholder="10-digit mobile" error={errors.guestPhone?.message} />
            )} />
            <Controller control={control} name="visitDate" render={({ field: { value, onChange } }) => (
              <Input label="Visit date" value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCorrect={false} error={errors.visitDate?.message} hint="Today or later" />
            )} />
            <Controller control={control} name="visitPurpose" render={({ field: { value, onChange } }) => (
              <Dropdown label="Purpose" value={value} options={PURPOSES} onChange={onChange} error={errors.visitPurpose?.message} />
            )} />
            <Controller control={control} name="validTill" render={({ field: { value, onChange } }) => (
              <Input label="Valid till (optional)" value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCorrect={false} error={errors.validTill?.message} hint="For regular visitors — max 30 days" />
            )} />
            <Controller control={control} name="vehicleNo" render={({ field: { value, onChange } }) => (
              <Input label="Vehicle no. (optional)" value={value} onChangeText={onChange} maxLength={15} placeholder="UP 85 AB 1234" />
            )} />

            <Button title={passBusy ? 'Generating…' : 'Generate Guest Pass'} onPress={handleSubmit(submit)} loading={passBusy} style={{ marginTop: spacing.md }} />
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
});
