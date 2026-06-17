import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { palette, radius, spacing, typography } from '../theme';

export default function RadioGroup({ label, options = [], value, onChange, error, direction = 'row' }) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.options, direction === 'column' && { flexDirection: 'column' }]}>
        {options.map(opt => {
          const optValue = typeof opt === 'string' ? opt : opt.value;
          const optLabel = typeof opt === 'string' ? opt : opt.label;
          const selected = value === optValue;
          return (
            <TouchableOpacity
              key={optValue}
              activeOpacity={0.85}
              style={[styles.option, selected && styles.optionActive]}
              onPress={() => onChange(optValue)}
            >
              <View style={[styles.dot, selected && styles.dotActive]}>
                {selected ? <View style={styles.dotInner} /> : null}
              </View>
              <Text style={[styles.optText, selected && styles.optTextActive]}>{optLabel}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: 8 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  optionActive: { borderColor: palette.primary, backgroundColor: '#EEF2FF' },
  dot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 1.5, borderColor: palette.border,
    marginRight: 8, alignItems: 'center', justifyContent: 'center',
  },
  dotActive: { borderColor: palette.primary },
  dotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.primary },
  optText: { fontSize: 13, color: palette.text },
  optTextActive: { color: palette.primary, fontWeight: '600' },
  error: { ...typography.caption, color: palette.error, marginTop: 4 },
});
