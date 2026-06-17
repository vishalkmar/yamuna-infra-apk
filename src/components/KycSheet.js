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
import { submitKyc } from '../store/slices/profileSlice';
import { showToast } from '../utils/toastConfig';

const ID_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar' },
  { value: 'pan', label: 'PAN' },
  { value: 'passport', label: 'Passport' },
  { value: 'voter', label: 'Voter ID' },
  { value: 'dl', label: 'Driving Licence' },
];

const schema = Yup.object().shape({
  idType: Yup.string().required('Choose an ID type'),
  idNumber: Yup.string().min(6, 'Enter a valid ID number').max(20).required('ID number required'),
  terms: Yup.boolean().oneOf([true], 'Please confirm the details are correct'),
});

const defaults = () => ({ idType: 'aadhaar', idNumber: '', terms: false });

export default function KycSheet({ visible, onClose, onSaved }) {
  const dispatch = useDispatch();
  const { saveBusy } = useSelector(s => s.profile);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema), defaultValues: defaults(),
  });

  useEffect(() => { if (visible) reset(defaults()); }, [visible, reset]);

  const submit = async data => {
    try {
      await dispatch(submitKyc({ idType: data.idType, idNumber: data.idNumber })).unwrap();
      showToast('success', 'Submitted', 'KYC sent for verification. We will notify you shortly.');
      onSaved?.();
      onClose();
    } catch (e) {
      showToast('error', 'Could not submit', String(e));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={typography.h2}>KYC Verification</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}><Text style={styles.close}>×</Text></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={typography.bodyMuted}>Submit a government ID to complete verification. Your number is stored masked.</Text>
            <View style={{ height: spacing.md }} />
            <Controller control={control} name="idType" render={({ field: { value, onChange } }) => (
              <Dropdown label="ID type" value={value} options={ID_TYPES} onChange={onChange} error={errors.idType?.message} />
            )} />
            <Controller control={control} name="idNumber" render={({ field: { value, onChange } }) => (
              <Input label="ID number" value={value} onChangeText={onChange} autoCapitalize="characters" placeholder="As printed on the ID" error={errors.idNumber?.message} />
            )} />
            <Controller control={control} name="terms" render={({ field: { value, onChange } }) => (
              <TouchableOpacity style={styles.termsRow} onPress={() => onChange(!value)} activeOpacity={0.7}>
                <View style={[styles.checkbox, value && styles.checkboxOn]}>{value ? <Text style={styles.checkmark}>✓</Text> : null}</View>
                <Text style={styles.termsText}>I confirm these details are correct and mine.</Text>
              </TouchableOpacity>
            )} />
            {errors.terms ? <Text style={styles.err}>{errors.terms.message}</Text> : null}
            <Button title={saveBusy ? 'Submitting…' : 'Submit for Verification'} onPress={handleSubmit(submit)} loading={saveBusy} style={{ marginTop: spacing.md }} />
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
  termsRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: palette.border, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  checkboxOn: { backgroundColor: palette.primary, borderColor: palette.primary },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '800' },
  termsText: { flex: 1, fontSize: 13, color: palette.text },
  err: { color: palette.error, fontSize: 12, marginTop: 4 },
});
