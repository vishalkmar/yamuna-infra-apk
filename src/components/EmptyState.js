import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, spacing, typography, NEU } from '../theme';

export default function EmptyState({ icon = '📭', title, message, children }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWell}><Text style={styles.icon}>{icon}</Text></View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  iconWell: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface, boxShadow: NEU.raised, marginBottom: spacing.md },
  icon: { fontSize: 38 },
  title: { ...typography.h3, textAlign: 'center', marginBottom: 4 },
  message: { ...typography.bodyMuted, textAlign: 'center', maxWidth: 260 },
});
