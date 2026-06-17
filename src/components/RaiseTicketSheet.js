import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';

import Input from './Input';
import Button from './Button';
import RadioGroup from './RadioGroup';
import Dropdown from './Dropdown';
import { palette, spacing, typography } from '../theme';
import { createTicket } from '../store/slices/supportSlice';
import { showToast } from '../utils/toastConfig';

const CATEGORIES = [
  { value: 'payment',      label: 'Payment' },
  { value: 'construction', label: 'Construction' },
  { value: 'document',     label: 'Document' },
  { value: 'general',      label: 'General' },
];

const schema = Yup.object().shape({
  category: Yup.string().oneOf(CATEGORIES.map(c => c.value)).required('Choose a category'),
  subject: Yup.string().min(10, 'Min 10 characters').max(100, 'Max 100 characters').required('Enter a subject'),
  description: Yup.string().min(20, 'Min 20 characters').max(1000, 'Max 1000 characters').required('Describe your issue'),
  priority: Yup.string().oneOf(['normal', 'urgent']).required(),
});

const defaults = () => ({ category: 'general', subject: '', description: '', priority: 'normal' });

export default function RaiseTicketSheet({ visible, onClose, onCreated }) {
  const dispatch = useDispatch();
  const { createBusy } = useSelector(s => s.support);

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: defaults(),
  });

  useEffect(() => { if (visible) reset(defaults()); }, [visible, reset]);

  const subject = watch('subject') || '';
  const description = watch('description') || '';

  const submit = async data => {
    try {
      const result = await dispatch(createTicket(data)).unwrap();
      showToast(
        'success',
        'Ticket raised!',
        `#${result.ticketCode} created. Expect a response within 24 hours.`,
      );
      onCreated?.(result);
      onClose();
    } catch (e) {
      showToast('error', 'Failed', String(e));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={typography.h2}>Raise a Ticket</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Controller
              control={control}
              name="category"
              render={({ field: { value, onChange } }) => (
                <Dropdown
                  label="Category"
                  value={value}
                  options={CATEGORIES}
                  onChange={onChange}
                  error={errors.category?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="subject"
              render={({ field: { value, onChange } }) => (
                <Input
                  label="Subject"
                  value={value}
                  onChangeText={onChange}
                  maxLength={100}
                  placeholder="Brief subject"
                  error={errors.subject?.message}
                  hint={`${subject.length} / 100`}
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { value, onChange } }) => (
                <Input
                  label="Description"
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={5}
                  maxLength={1000}
                  placeholder="Describe your issue in detail…"
                  error={errors.description?.message}
                  hint={`${description.length} / 1000`}
                />
              )}
            />

            <Controller
              control={control}
              name="priority"
              render={({ field: { value, onChange } }) => (
                <RadioGroup
                  label="Priority"
                  value={value}
                  onChange={onChange}
                  options={[
                    { value: 'normal', label: 'Normal' },
                    { value: 'urgent', label: 'Urgent' },
                  ]}
                  error={errors.priority?.message}
                />
              )}
            />

            <Button
              title={createBusy ? 'Submitting…' : 'Submit Ticket'}
              onPress={handleSubmit(submit)}
              loading={createBusy}
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
    padding: spacing.lg, paddingBottom: spacing.xxl,
    maxHeight: '92%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  close: { fontSize: 26, color: palette.textMuted },
});
