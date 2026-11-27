import React from 'react';
import { View, StyleSheet } from 'react-native';
import { palette, spacing, NEU } from '../theme';

// Neumorphic card: same colour as the page, lifted by a soft light/dark
// shadow pair. `elevated={false}` gives a flat panel, `inset` a pressed well.
export default function Card({ children, style, padded = true, elevated = true, inset = false }) {
  return (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        { boxShadow: inset ? NEU.inset : elevated ? NEU.raised : undefined },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  padded: { padding: spacing.lg },
});
