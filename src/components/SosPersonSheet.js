import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

import Input from './Input';
import Button from './Button';

import { palette, spacing, typography } from '../theme';

const MOBILE = /^[6-9]\d{9}$/;

const schema = Yup.object().shape({
  name: Yup.string().min(2, 'Enter a name').required('Name required'),
  phone: Yup.string().matches(MOBILE, 'Valid 10-digit mobile (6-9)').required('Phone required'),
  email: Yup.string().email('Invalid email').nullable(),
});

const defaults = (p = {}) => ({ name: p.name || '', phone: p.phone || '', email: p.email || '' });

// `person` null = add mode; object = edit mode. onSubmit(person) handed back to screen.
export default function SosPersonSheet({ visible, person, onClose, onSubmit, busy }) {
  const editing = !!person;
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema), defaultValues: defaults(person || {}),
  });

  useEffect(() => { if (visible) reset(defaults(person || {})); }, [visible, person, reset]);

  const submit = data => {
    onSubmit({ ...(person || {}), name: data.name.trim(), phone: data.phone, email: data.email?.trim() || '' });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={typography.h2}>{editing ? 'Edit Person' : 'Add Emergency Person'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}><Text style={styles.close}>×</Text></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={typography.bodyMuted}>This person will get your live location on SOS via WhatsApp, SMS and email.</Text>
            <View style={{ height: spacing.md }} />
            <Controller control={control} name="name" render={({ field: { value, onChange } }) => (
              <Input label="Name" value={value} onChangeText={onChange} placeholder="Full name" error={errors.name?.message} />
            )} />
            <Controller control={control} name="phone" render={({ field: { value, onChange } }) => (
              <Input label="Phone" value={value} onChangeText={onChange} keyboardType="number-pad" maxLength={10} placeholder="10-digit mobile" error={errors.phone?.message} />
            )} />
            <Controller control={control} name="email" render={({ field: { value, onChange } }) => (
              <Input label="Email (recommended)" value={value} onChangeText={onChange} keyboardType="email-address" autoCapitalize="none" placeholder="name@example.com" error={errors.email?.message} />
            )} />
            <Button title={busy ? 'Saving…' : editing ? 'Save Changes' : 'Add Person'} onPress={handleSubmit(submit)} loading={busy} style={{ marginTop: spacing.md }} />
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
