import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, radius, NEU } from '../theme';

const variantMap = {
  success: { bg: '#DCF5E7', fg: '#16794A' },
  error: { bg: '#FDE4E4', fg: '#C62828' },
  warning: { bg: '#FDF0DA', fg: '#B26A00' },
  info: { bg: '#E3ECFB', fg: '#1E3A78' },
  neutral: { bg: palette.surface, fg: palette.textMuted },
  primary: { bg: '#E3ECFB', fg: palette.primary },
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
    paddingVertical: 5,
    borderRadius: radius.pill,
    boxShadow: NEU.raisedSm,
  },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
});
