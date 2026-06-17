import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { palette, spacing, typography } from '../theme';

export default function SectionHeader({ title, subtitle, actionLabel, onActionPress }) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={typography.h3}>{title}</Text>
        {subtitle ? <Text style={typography.caption}>{subtitle}</Text> : null}
      </View>
      {actionLabel ? (
        <TouchableOpacity onPress={onActionPress} hitSlop={10}>
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  left: { flex: 1, paddingRight: spacing.md },
  action: { color: palette.primary, fontWeight: '600', fontSize: 13 },
});
