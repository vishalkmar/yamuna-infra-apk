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
import { saveContacts } from '../store/slices/sosSlice';
import { showToast } from '../utils/toastConfig';

const RELATIONS = ['son', 'daughter', 'spouse', 'sibling', 'parent', 'other']
  .map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }));
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
  .map(b => ({ value: b, label: b }));

const MOBILE = /^[6-9]\d{9}$/;

const schema = Yup.object().shape({
  c1Name: Yup.string().min(3, 'Min 3 characters').required('Primary contact name required'),
  c1Phone: Yup.string().matches(MOBILE, 'Valid 10-digit mobile (6-9)').required('Primary phone required'),
  c1Rel: Yup.string().required('Choose relation'),
  c2Name: Yup.string().nullable(),
  c2Phone: Yup.string().nullable().test('c2', 'Valid 10-digit mobile (6-9)', v => !v || MOBILE.test(v)),
  c2Rel: Yup.string().nullable(),
  bloodGroup: Yup.string().required('Select blood group'),
  medicalNotes: Yup.string().max(500, 'Max 500 characters').nullable(),
});

const defaults = (existing = {}) => ({
  c1Name: existing.contacts?.[0]?.name || '',
  c1Phone: existing.contacts?.[0]?.phone || '',
  c1Rel: existing.contacts?.[0]?.relation || 'son',
  c2Name: existing.contacts?.[1]?.name || '',
  c2Phone: existing.contacts?.[1]?.phone || '',
  c2Rel: existing.contacts?.[1]?.relation || 'other',
  bloodGroup: existing.bloodGroup || 'O+',
  medicalNotes: existing.medicalNotes || '',
});

export default function EmergencyContactsSheet({ visible, onClose, onSaved }) {
  const dispatch = useDispatch();
  const sos = useSelector(s => s.sos);
  const { saveBusy } = sos;

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: defaults(sos),
  });

  useEffect(() => { if (visible) reset(defaults(sos)); }, [visible, reset]); // eslint-disable-line react-hooks/exhaustive-deps

  const notes = watch('medicalNotes') || '';

  const submit = async data => {
    const contacts = [{ name: data.c1Name, phone: data.c1Phone, relation: data.c1Rel }];
    if (data.c2Name && data.c2Phone) {
      contacts.push({ name: data.c2Name, phone: data.c2Phone, relation: data.c2Rel || 'other' });
    }
    try {
      await dispatch(saveContacts({ contacts, bloodGroup: data.bloodGroup, medicalNotes: data.medicalNotes || undefined })).unwrap();
      showToast('success', 'Saved', 'Emergency contacts saved successfully.');
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
            <Text style={typography.h2}>Emergency Contacts</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}><Text style={styles.close}>×</Text></TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.group}>Primary contact</Text>
            <Controller control={control} name="c1Name" render={({ field: { value, onChange } }) => (
              <Input label="Name" value={value} onChangeText={onChange} placeholder="Full name" error={errors.c1Name?.message} />
            )} />
            <Controller control={control} name="c1Phone" render={({ field: { value, onChange } }) => (
              <Input label="Phone" value={value} onChangeText={onChange} keyboardType="number-pad" maxLength={10} placeholder="10-digit mobile" error={errors.c1Phone?.message} />
            )} />
            <Controller control={control} name="c1Rel" render={({ field: { value, onChange } }) => (
              <Dropdown label="Relation" value={value} options={RELATIONS} onChange={onChange} error={errors.c1Rel?.message} />
            )} />

            <Text style={styles.group}>Secondary contact (optional)</Text>
            <Controller control={control} name="c2Name" render={({ field: { value, onChange } }) => (
              <Input label="Name" value={value} onChangeText={onChange} placeholder="Full name" />
            )} />
            <Controller control={control} name="c2Phone" render={({ field: { value, onChange } }) => (
              <Input label="Phone" value={value} onChangeText={onChange} keyboardType="number-pad" maxLength={10} placeholder="10-digit mobile" error={errors.c2Phone?.message} />
            )} />
            <Controller control={control} name="c2Rel" render={({ field: { value, onChange } }) => (
              <Dropdown label="Relation" value={value} options={RELATIONS} onChange={onChange} />
            )} />

            <Text style={styles.group}>Medical info</Text>
            <Controller control={control} name="bloodGroup" render={({ field: { value, onChange } }) => (
              <Dropdown label="Blood group" value={value} options={BLOOD_GROUPS} onChange={onChange} error={errors.bloodGroup?.message} />
            )} />
            <Controller control={control} name="medicalNotes" render={({ field: { value, onChange } }) => (
              <Input
                label="Medical notes (optional)"
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={3}
                maxLength={500}
                placeholder="Allergies, conditions, medications…"
                error={errors.medicalNotes?.message}
                hint={`${notes.length} / 500`}
              />
            )} />

            <Button title={saveBusy ? 'Saving…' : 'Save Contacts'} onPress={handleSubmit(submit)} loading={saveBusy} style={{ marginTop: spacing.md }} />
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
  group: { ...typography.label, color: palette.primary, marginBottom: spacing.sm, marginTop: spacing.sm },
});
