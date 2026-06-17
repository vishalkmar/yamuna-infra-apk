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
import { savePersonal } from '../store/slices/profileSlice';
import { showToast } from '../utils/toastConfig';

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];
const MOBILE = /^[6-9]\d{9}$/;

const schema = Yup.object().shape({
  name: Yup.string().min(3, 'Min 3 characters').required('Name required'),
  email: Yup.string().email('Invalid email').nullable(),
  dob: Yup.string().matches(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').nullable(),
  gender: Yup.string().nullable(),
  altPhone: Yup.string().nullable().test('alt', 'Valid 10-digit mobile (6-9)', v => !v || MOBILE.test(v)),
  occupation: Yup.string().max(60).nullable(),
  addressLine: Yup.string().max(120).nullable(),
  city: Yup.string().max(60).nullable(),
  state: Yup.string().max(60).nullable(),
  pincode: Yup.string().nullable().test('pin', '6-digit pincode', v => !v || /^\d{6}$/.test(v)),
});

const defaults = (p = {}) => ({
  name: p.name || '', email: p.email || '', dob: p.dob || '', gender: p.gender || 'male',
  altPhone: p.altPhone || '', occupation: p.occupation || '',
  addressLine: p.addressLine || '', city: p.city || '', state: p.state || '', pincode: p.pincode || '',
});

export default function PersonalDetailsSheet({ visible, onClose, onSaved }) {
  const dispatch = useDispatch();
  const { personal, saveBusy } = useSelector(s => s.profile);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema), defaultValues: defaults(personal || {}),
  });

  useEffect(() => { if (visible) reset(defaults(personal || {})); }, [visible, reset]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async data => {
    try {
      await dispatch(savePersonal({
        name: data.name, email: data.email || '', dob: data.dob || '', gender: data.gender,
        altPhone: data.altPhone || '', occupation: data.occupation || '',
        addressLine: data.addressLine || '', city: data.city || '', state: data.state || '', pincode: data.pincode || '',
      })).unwrap();
      showToast('success', 'Saved', 'Your details have been updated.');
      onSaved?.();
      onClose();
    } catch (e) {
      showToast('error', 'Could not save', String(e));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={typography.h2}>Personal Details</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}><Text style={styles.close}>×</Text></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Controller control={control} name="name" render={({ field: { value, onChange } }) => (
              <Input label="Full name" value={value} onChangeText={onChange} placeholder="Full name" error={errors.name?.message} />
            )} />
            <Controller control={control} name="email" render={({ field: { value, onChange } }) => (
              <Input label="Email" value={value} onChangeText={onChange} keyboardType="email-address" autoCapitalize="none" placeholder="name@example.com" error={errors.email?.message} />
            )} />
            <Controller control={control} name="dob" render={({ field: { value, onChange } }) => (
              <Input label="Date of birth" value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" error={errors.dob?.message} />
            )} />
            <Controller control={control} name="gender" render={({ field: { value, onChange } }) => (
              <Dropdown label="Gender" value={value} options={GENDERS} onChange={onChange} />
            )} />
            <Controller control={control} name="altPhone" render={({ field: { value, onChange } }) => (
              <Input label="Alternate phone (optional)" value={value} onChangeText={onChange} keyboardType="number-pad" maxLength={10} placeholder="10-digit mobile" error={errors.altPhone?.message} />
            )} />
            <Controller control={control} name="occupation" render={({ field: { value, onChange } }) => (
              <Input label="Occupation (optional)" value={value} onChangeText={onChange} placeholder="e.g. Business, Retired, Service" error={errors.occupation?.message} />
            )} />

            <Text style={styles.group}>Address</Text>
            <Controller control={control} name="addressLine" render={({ field: { value, onChange } }) => (
              <Input label="Address" value={value} onChangeText={onChange} placeholder="House / flat, street" error={errors.addressLine?.message} />
            )} />
            <Controller control={control} name="city" render={({ field: { value, onChange } }) => (
              <Input label="City" value={value} onChangeText={onChange} placeholder="City" error={errors.city?.message} />
            )} />
            <Controller control={control} name="state" render={({ field: { value, onChange } }) => (
              <Input label="State" value={value} onChangeText={onChange} placeholder="State" error={errors.state?.message} />
            )} />
            <Controller control={control} name="pincode" render={({ field: { value, onChange } }) => (
              <Input label="Pincode" value={value} onChangeText={onChange} keyboardType="number-pad" maxLength={6} placeholder="6-digit" error={errors.pincode?.message} />
            )} />

            <Button title={saveBusy ? 'Saving…' : 'Save Details'} onPress={handleSubmit(submit)} loading={saveBusy} style={{ marginTop: spacing.md }} />
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
  group: { ...typography.label, color: palette.primary, marginBottom: spacing.sm, marginTop: spacing.sm },
});
