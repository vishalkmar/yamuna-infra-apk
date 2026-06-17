import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import Button from './Button';
import RadioGroup from './RadioGroup';
import { palette, spacing, typography } from '../theme';
import { requestUtility } from '../store/slices/moveInSlice';
import { showToast } from '../utils/toastConfig';

const UTILITIES = [
  { value: 'electricity', label: '⚡ Electricity' },
  { value: 'water',       label: '💧 Water' },
  { value: 'piped_gas',   label: '🔥 Piped Gas' },
  { value: 'internet',    label: '🌐 Internet / Fiber' },
];

export default function UtilityRequestSheet({ visible, onClose, onRequested }) {
  const dispatch = useDispatch();
  const { utilityBusy } = useSelector(s => s.movein);
  const [type, setType] = useState('electricity');

  useEffect(() => { if (visible) setType('electricity'); }, [visible]);

  const submit = async () => {
    try {
      const res = await dispatch(requestUtility({ utilityType: type })).unwrap();
      showToast('success', 'Request submitted', `Expected activation: ${res.expectedActivation}.`);
      onRequested?.(res);
      onClose();
    } catch (e) {
      showToast('error', 'Could not request', String(e));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={typography.h2}>Activate a Utility</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}><Text style={styles.close}>×</Text></TouchableOpacity>
          </View>

          <RadioGroup
            label="Which connection?"
            value={type}
            onChange={setType}
            direction="column"
            options={UTILITIES}
          />

          <Button
            title={utilityBusy ? 'Submitting…' : 'Submit Request'}
            onPress={submit}
            loading={utilityBusy}
            style={{ marginTop: spacing.md }}
          />
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
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  close: { fontSize: 26, color: palette.textMuted },
});
