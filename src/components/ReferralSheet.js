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
import { submitReferral } from '../store/slices/rewardsSlice';
import { showToast } from '../utils/toastConfig';

const RELATIONSHIPS = [
  { value: 'friend', label: 'Friend' },
  { value: 'relative', label: 'Relative' },
  { value: 'colleague', label: 'Colleague' },
  { value: 'neighbor', label: 'Neighbor' },
];

const schema = Yup.object().shape({
  refereeName: Yup.string().min(3, 'Min 3 characters').required('Name required'),
  refereePhone: Yup.string().matches(/^[6-9]\d{9}$/, 'Valid 10-digit mobile').required('Phone required'),
  refereeEmail: Yup.string().email('Valid email').nullable(),
  interestedIn: Yup.string().required('Select a project'),
  relationship: Yup.string().oneOf(RELATIONSHIPS.map(r => r.value)).required('Choose relationship'),
});

const defaults = (interestedIn) => () => ({ refereeName: '', refereePhone: '', refereeEmail: '', interestedIn: interestedIn || '', relationship: 'friend' });

export default function ReferralSheet({ visible, projects = [], onClose, onDone }) {
  const dispatch = useDispatch();
  const { referralBusy } = useSelector(s => s.rewards);
  const projectOptions = projects.map(p => ({ value: p.name, label: p.name }));

  const makeDefaults = defaults(projects[0]?.name);
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema), defaultValues: makeDefaults(),
  });

  useEffect(() => { if (visible) reset(makeDefaults()); }, [visible, projects, reset]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async data => {
    try {
      const res = await dispatch(submitReferral({
        refereeName: data.refereeName, refereePhone: data.refereePhone,
        refereeEmail: data.refereeEmail || undefined, interestedIn: data.interestedIn, relationship: data.relationship,
      })).unwrap();
      showToast('success', 'Referral submitted!', `You earn ₹${res.reward} when ${data.refereeName} books.`);
      onDone?.();
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
            <Text style={typography.h2}>Refer & Earn</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}><Text style={styles.close}>×</Text></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Controller control={control} name="refereeName" render={({ field: { value, onChange } }) => (
              <Input label="Friend / family name" value={value} onChangeText={onChange} placeholder="Full name" error={errors.refereeName?.message} />
            )} />
            <Controller control={control} name="refereePhone" render={({ field: { value, onChange } }) => (
              <Input label="Phone" value={value} onChangeText={onChange} keyboardType="number-pad" maxLength={10} placeholder="10-digit mobile" error={errors.refereePhone?.message} />
            )} />
            <Controller control={control} name="refereeEmail" render={({ field: { value, onChange } }) => (
              <Input label="Email (optional)" value={value} onChangeText={onChange} keyboardType="email-address" autoCapitalize="none" placeholder="email@example.com" error={errors.refereeEmail?.message} />
            )} />
            <Controller control={control} name="interestedIn" render={({ field: { value, onChange } }) => (
              <Dropdown label="Interested in" value={value} options={projectOptions} onChange={onChange} error={errors.interestedIn?.message} />
            )} />
            <Controller control={control} name="relationship" render={({ field: { value, onChange } }) => (
              <Dropdown label="Relationship" value={value} options={RELATIONSHIPS} onChange={onChange} error={errors.relationship?.message} />
            )} />
            <Button title={referralBusy ? 'Submitting…' : 'Submit Referral'} onPress={handleSubmit(submit)} loading={referralBusy} style={{ marginTop: spacing.md }} />
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
