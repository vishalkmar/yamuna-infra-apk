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
import { addFamily, editFamily } from '../store/slices/profileSlice';
import { showToast } from '../utils/toastConfig';

const RELATIONS = ['spouse', 'son', 'daughter', 'parent', 'sibling', 'other']
  .map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }));
const MOBILE = /^[6-9]\d{9}$/;

const schema = Yup.object().shape({
  name: Yup.string().min(2, 'Enter a name').required('Name required'),
  relation: Yup.string().required('Choose relation'),
  age: Yup.string().nullable().test('age', '0–120', v => !v || (/^\d{1,3}$/.test(v) && Number(v) <= 120)),
  phone: Yup.string().nullable().test('phone', 'Valid 10-digit mobile (6-9)', v => !v || MOBILE.test(v)),
});

const defaults = (m = {}) => ({
  name: m.name || '', relation: m.relation || 'spouse',
  age: m.age != null ? String(m.age) : '', phone: m.phone || '',
});

// `member` null = add mode; object = edit mode.
export default function FamilyMemberSheet({ visible, member, onClose, onSaved }) {
  const dispatch = useDispatch();
  const { saveBusy } = useSelector(s => s.profile);
  const editing = !!member;

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema), defaultValues: defaults(member || {}),
  });

  useEffect(() => { if (visible) reset(defaults(member || {})); }, [visible, member, reset]);

  const submit = async data => {
    const payload = {
      name: data.name, relation: data.relation,
      age: data.age ? Number(data.age) : null, phone: data.phone || '',
    };
    try {
      if (editing) await dispatch(editFamily({ id: member.id, ...payload })).unwrap();
      else await dispatch(addFamily(payload)).unwrap();
      showToast('success', editing ? 'Updated' : 'Added', `${data.name} saved to your family.`);
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
            <Text style={typography.h2}>{editing ? 'Edit Member' : 'Add Family Member'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}><Text style={styles.close}>×</Text></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Controller control={control} name="name" render={({ field: { value, onChange } }) => (
              <Input label="Name" value={value} onChangeText={onChange} placeholder="Full name" error={errors.name?.message} />
            )} />
            <Controller control={control} name="relation" render={({ field: { value, onChange } }) => (
              <Dropdown label="Relation" value={value} options={RELATIONS} onChange={onChange} error={errors.relation?.message} />
            )} />
            <Controller control={control} name="age" render={({ field: { value, onChange } }) => (
              <Input label="Age (optional)" value={value} onChangeText={onChange} keyboardType="number-pad" maxLength={3} placeholder="e.g. 36" error={errors.age?.message} />
            )} />
            <Controller control={control} name="phone" render={({ field: { value, onChange } }) => (
              <Input label="Phone (optional)" value={value} onChangeText={onChange} keyboardType="number-pad" maxLength={10} placeholder="10-digit mobile" error={errors.phone?.message} />
            )} />
            <Button title={saveBusy ? 'Saving…' : editing ? 'Save Changes' : 'Add Member'} onPress={handleSubmit(submit)} loading={saveBusy} style={{ marginTop: spacing.md }} />
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
