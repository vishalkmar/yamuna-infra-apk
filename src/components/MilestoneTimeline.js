import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { palette, radius, spacing, typography } from '../theme';
import { formatDate } from '../utils/format';

const STATE = {
  completed:   { color: palette.success, icon: '✓', label: 'Completed' },
  in_progress: { color: palette.warning, icon: '●', label: 'In progress' },
  pending:     { color: palette.border,  icon: '○', label: 'Pending' },
};

export default function MilestoneTimeline({ milestones = [], onSelect }) {
  return (
    <View>
      {milestones.map((m, idx) => (
        <Row
          key={m.id}
          milestone={m}
          isLast={idx === milestones.length - 1}
          onPress={() => onSelect?.(m)}
        />
      ))}
    </View>
  );
}

function Row({ milestone, isLast, onPress }) {
  const state = STATE[milestone.status] || STATE.pending;
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.gutter}>
          <View style={[styles.dot, { backgroundColor: state.color, borderColor: state.color }]}>
            <Text style={styles.dotIcon}>{state.icon}</Text>
          </View>
          {!isLast ? (
            <View
              style={[
                styles.line,
                { backgroundColor: milestone.status === 'completed' ? palette.success : palette.divider },
              ]}
            />
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.headerRow}>
            <Text style={[typography.h3, { flex: 1 }]} numberOfLines={1}>{milestone.name}</Text>
            {milestone.notificationsEnabled ? <Text style={styles.bell}>🔔</Text> : null}
          </View>

          <Text style={[styles.stateLabel, { color: state.color }]}>{state.label}</Text>

          {milestone.completedAt ? (
            <Text style={styles.meta}>Completed {formatDate(milestone.completedAt)}</Text>
          ) : milestone.expectedDate ? (
            <Text style={styles.meta}>Expected {formatDate(milestone.expectedDate)}</Text>
          ) : null}

          {milestone.description ? (
            <Text style={styles.desc} numberOfLines={2}>{milestone.description}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  gutter: { width: 40, alignItems: 'center' },
  dot: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 1,
  },
  dotIcon: { color: '#fff', fontSize: 13, fontWeight: '800' },
  line: { width: 2, flex: 1, marginTop: -4, marginBottom: -4 },
  body: {
    flex: 1,
    marginLeft: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  bell: { fontSize: 14, marginLeft: spacing.sm },
  stateLabel: { fontSize: 12, fontWeight: '700', marginTop: 2, letterSpacing: 0.4 },
  meta: { ...typography.caption, marginTop: 4 },
  desc: { ...typography.bodyMuted, marginTop: 6 },
});
