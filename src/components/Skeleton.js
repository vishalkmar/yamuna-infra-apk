import React from 'react';
import { View, StyleSheet } from 'react-native';
import { palette, radius, spacing } from '../theme';

// Minimal static skeleton block. (No animation — keeps zero native deps.)
export function SkeletonBlock({ height = 16, width = '100%', style }) {
  return (
    <View
      style={[
        {
          height,
          width,
          backgroundColor: palette.surfaceAlt,
          borderRadius: radius.sm,
          marginBottom: 8,
        },
        style,
      ]}
    />
  );
}

export function CardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBlock height={14} width="40%" />
      <SkeletonBlock height={22} width="70%" />
      <SkeletonBlock height={12} width="55%" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.divider,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
});
