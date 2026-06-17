import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { palette, radius, spacing, typography } from '../theme';

// Accepts YYYY-MM-DD on the wire (backend format). Display is the same for
// simplicity. Validation: matches /^\d{4}-\d{2}-\d{2}$/ before propagating.
function isValidIso(s) {
  if (!s) return true; // empty allowed
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s);
  return !isNaN(d.getTime());
}

export default function DateRangeInput({ from, to, onChange, label = 'Date range' }) {
  const fromOk = isValidIso(from);
  const toOk = isValidIso(to);
  const orderOk = !from || !to || from <= to;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.sub}>FROM</Text>
          <TextInput
            placeholder="YYYY-MM-DD"
            placeholderTextColor={palette.textMuted}
            style={[styles.input, !fromOk && styles.invalid]}
            value={from}
            onChangeText={v => onChange({ from: v, to })}
            keyboardType="numbers-and-punctuation"
            autoCorrect={false}
          />
        </View>
        <View style={styles.col}>
          <Text style={styles.sub}>TO</Text>
          <TextInput
            placeholder="YYYY-MM-DD"
            placeholderTextColor={palette.textMuted}
            style={[styles.input, !toOk && styles.invalid]}
            value={to}
            onChangeText={v => onChange({ from, to: v })}
            keyboardType="numbers-and-punctuation"
            autoCorrect={false}
          />
        </View>
      </View>
      {!orderOk ? (
        <Text style={styles.err}>From date must be earlier than To date.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: 6 },
  row: { flexDirection: 'row', gap: spacing.sm },
  col: { flex: 1 },
  sub: { ...typography.caption, marginBottom: 4 },
  input: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: palette.text,
  },
  invalid: { borderColor: palette.error },
  err: { color: palette.error, fontSize: 12, marginTop: 6 },
});
