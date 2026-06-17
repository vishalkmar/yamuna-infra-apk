import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, Image, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { palette, radius, spacing, typography } from '../theme';
import { formatDate } from '../utils/format';
import StatusChip from './StatusChip';
import {
  loadMilestone, setSubscription, clearSelectedMilestone,
} from '../store/slices/projectSlice';

const STATE_CHIP = {
  completed:   { variant: 'success', label: 'COMPLETED' },
  in_progress: { variant: 'warning', label: 'IN PROGRESS' },
  pending:     { variant: 'neutral', label: 'PENDING' },
};

export default function MilestoneDetailSheet({ visible, projectId, milestoneId, onClose }) {
  const dispatch = useDispatch();
  const { selectedMilestone, milestoneLoading, subscriptionBusy } = useSelector(s => s.project);

  useEffect(() => {
    if (visible && projectId && milestoneId) {
      dispatch(loadMilestone({ projectId, milestoneId }));
    }
  }, [visible, projectId, milestoneId, dispatch]);

  const close = () => {
    dispatch(clearSelectedMilestone());
    onClose();
  };

  const toggleNotifications = value => {
    if (!selectedMilestone) return;
    dispatch(setSubscription({
      projectId,
      milestoneId: selectedMilestone.id,
      enabled: value,
      channels: selectedMilestone.notificationChannels?.length
        ? selectedMilestone.notificationChannels
        : ['push'],
    }));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {milestoneLoading || !selectedMilestone ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={palette.primary} />
            </View>
          ) : (
            <Inner
              milestone={selectedMilestone}
              onClose={close}
              onToggle={toggleNotifications}
              toggleBusy={subscriptionBusy}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

function Inner({ milestone, onClose, onToggle, toggleBusy }) {
  const chip = STATE_CHIP[milestone.status] || STATE_CHIP.pending;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <StatusChip label={chip.label} variant={chip.variant} />
          <Text style={[typography.h2, { marginTop: spacing.sm }]}>{milestone.name}</Text>
          {milestone.completedAt ? (
            <Text style={typography.caption}>Completed {formatDate(milestone.completedAt)}</Text>
          ) : milestone.expectedDate ? (
            <Text style={typography.caption}>Expected by {formatDate(milestone.expectedDate)}</Text>
          ) : null}
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={10}>
          <Text style={styles.close}>×</Text>
        </TouchableOpacity>
      </View>

      {milestone.coverPhotoUrl ? (
        <Image source={{ uri: milestone.coverPhotoUrl }} style={styles.cover} resizeMode="cover" />
      ) : null}

      {milestone.description ? (
        <Text style={[typography.body, { marginTop: spacing.md }]}>{milestone.description}</Text>
      ) : null}

      {/* Notifications toggle */}
      <View style={styles.notifRow}>
        <View style={{ flex: 1 }}>
          <Text style={typography.label}>🔔  Push notifications</Text>
          <Text style={typography.caption}>
            Get notified when this milestone is updated
          </Text>
        </View>
        <Switch
          value={!!milestone.notificationsEnabled}
          onValueChange={onToggle}
          disabled={toggleBusy}
          trackColor={{ false: palette.surfaceAlt, true: palette.primary }}
        />
      </View>

      {/* Photos */}
      {milestone.photos?.length > 0 ? (
        <View style={styles.photosWrap}>
          <Text style={[typography.h3, { marginBottom: spacing.sm }]}>
            Photos · {milestone.photos.length}
          </Text>
          <FlatList
            data={milestone.photos}
            keyExtractor={p => String(p.id)}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: spacing.sm }}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.photoTile}>
                <Image source={{ uri: item.url }} style={styles.photoImg} resizeMode="cover" />
                {item.caption ? (
                  <Text style={styles.photoCaption} numberOfLines={2}>{item.caption}</Text>
                ) : null}
                {item.takenAt ? (
                  <Text style={typography.caption}>{formatDate(item.takenAt)}</Text>
                ) : null}
              </View>
            )}
          />
        </View>
      ) : (
        <Text style={[typography.bodyMuted, { marginTop: spacing.md, textAlign: 'center' }]}>
          📷  Photos will appear here when uploaded.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: palette.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '92%',
  },
  loading: { paddingVertical: spacing.xxl, alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  close: { fontSize: 26, color: palette.textMuted, paddingHorizontal: spacing.sm },
  cover: { width: '100%', height: 180, borderRadius: radius.md, marginTop: spacing.sm },
  notifRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1, borderColor: palette.divider,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  photosWrap: { marginTop: spacing.lg },
  photoTile: {
    width: '48.5%',
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: palette.divider,
    overflow: 'hidden',
    padding: spacing.sm,
  },
  photoImg: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.sm, backgroundColor: palette.surfaceAlt },
  photoCaption: { fontSize: 12, fontWeight: '600', color: palette.text, marginTop: 6 },
});
