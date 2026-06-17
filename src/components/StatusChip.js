import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, radius } from '../theme';

const variantMap = {
  success: { bg: '#DCFCE7', fg: '#15803D' },
  error: { bg: '#FEE2E2', fg: '#B91C1C' },
  warning: { bg: '#FEF3C7', fg: '#B45309' },
  info: { bg: '#DBEAFE', fg: '#1D4ED8' },
  neutral: { bg: palette.surfaceAlt, fg: palette.textMuted },
  primary: { bg: '#E0E7FF', fg: palette.primary },
};

export default function StatusChip({ label, variant = 'neutral', style }) {
  const c = variantMap[variant] || variantMap.neutral;
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }, style]}>
      <Text style={[styles.label, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
});
