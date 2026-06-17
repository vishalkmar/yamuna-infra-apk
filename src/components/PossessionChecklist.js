import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, spacing } from '../theme';

const CATEGORY_ICON = {
  payment: '💳', document: '📄', inspection: '🔍', handover: '🔑',
};

export default function PossessionChecklist({ items = [] }) {
  if (!items.length) return null;
  return (
    <View style={styles.wrap}>
      {items.map((item, i) => (
        <View key={item.id} style={[styles.row, i < items.length - 1 && styles.divider]}>
          <View style={[styles.tick, item.completed ? styles.tickDone : styles.tickPending]}>
            <Text style={[styles.tickText, item.completed && styles.tickTextDone]}>
              {item.completed ? '✓' : '○'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.step, item.completed && styles.stepDone]}>{item.step}</Text>
            {item.category ? (
              <Text style={styles.cat}>{CATEGORY_ICON[item.category] || '•'} {item.category}</Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  divider: { borderBottomWidth: 1, borderBottomColor: palette.divider },
  tick: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  tickDone: { backgroundColor: '#DCFCE7' },
  tickPending: { backgroundColor: palette.surfaceAlt, borderWidth: 1, borderColor: palette.border },
  tickText: { fontSize: 14, fontWeight: '800', color: palette.textMuted },
  tickTextDone: { color: '#15803D' },
  step: { fontSize: 14, fontWeight: '600', color: palette.text },
  stepDone: { color: palette.textMuted, textDecorationLine: 'line-through' },
  cat: { fontSize: 11, color: palette.textMuted, marginTop: 2, textTransform: 'capitalize' },
});
