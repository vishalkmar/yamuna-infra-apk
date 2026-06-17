import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, spacing, typography } from '../theme';

export default function EmptyState({ icon = '📭', title, message, children }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>{icon}</Text>
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
  icon: { fontSize: 42, marginBottom: spacing.sm },
  title: { ...typography.h3, textAlign: 'center', marginBottom: 4 },
  message: { ...typography.bodyMuted, textAlign: 'center', maxWidth: 260 },
});
