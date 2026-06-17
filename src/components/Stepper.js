import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { palette, radius, spacing, typography } from '../theme';

export default function Stepper({ label, value, onChange, min = 0, max = 10, suffix }) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  const atMin = value <= min;
  const atMax = value >= max;
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <TouchableOpacity onPress={dec} disabled={atMin} style={[styles.btn, atMin && styles.btnDisabled]}>
          <Text style={[styles.btnText, atMin && { color: palette.textMuted }]}>−</Text>
        </TouchableOpacity>
        <View style={styles.valueWrap}>
          <Text style={styles.value}>{value}</Text>
          {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
        </View>
        <TouchableOpacity onPress={inc} disabled={atMax} style={[styles.btn, atMax && styles.btnDisabled]}>
          <Text style={[styles.btnText, atMax && { color: palette.textMuted }]}>＋</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center' },
  btn: {
    width: 44, height: 44,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: palette.border,
    backgroundColor: palette.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { backgroundColor: palette.surfaceAlt, borderColor: palette.divider },
  btnText: { fontSize: 22, fontWeight: '700', color: palette.primary },
  valueWrap: { flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  value: { fontSize: 22, fontWeight: '700', color: palette.text },
  suffix: { fontSize: 13, color: palette.textMuted, marginLeft: 6 },
});
