import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { palette, radius, spacing, typography } from '../theme';
import { formatDate } from '../utils/format';
import StatusChip from './StatusChip';
import { loadMilestone, clearSelectedMilestone } from '../store/slices/projectSlice';

const STATE_CHIP = {
  completed:   { variant: 'success', label: 'COMPLETED' },
  in_progress: { variant: 'warning', label: 'IN PROGRESS' },
  pending:     { variant: 'neutral', label: 'PENDING' },
};

// Raw admin status → human label (richer than the 3 visual states).
const RAW_LABEL = {
  planned: 'PLANNED', in_progress: 'IN PROGRESS', completed: 'COMPLETED',
  postponed: 'POSTPONED', on_hold: 'ON HOLD',
};

export default function MilestoneDetailSheet({ visible, propertyId, milestoneId, onClose }) {
  const dispatch = useDispatch();
  const { selectedMilestone, milestoneLoading } = useSelector(s => s.project);

  useEffect(() => {
    if (visible && propertyId && milestoneId) {
      dispatch(loadMilestone({ propertyId, milestoneId }));
    }
  }, [visible, propertyId, milestoneId, dispatch]);

  const close = () => {
    dispatch(clearSelectedMilestone());
    onClose();
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
            <Inner milestone={selectedMilestone} onClose={close} />
          )}
        </View>
      </View>
    </Modal>
  );
}

function Inner({ milestone, onClose }) {
  const chip = STATE_CHIP[milestone.status] || STATE_CHIP.pending;
  const rawLabel = RAW_LABEL[milestone.rawStatus] || chip.label;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <StatusChip label={rawLabel} variant={chip.variant} />
          <Text style={[typography.h2, { marginTop: spacing.sm }]}>{milestone.name}</Text>
          {milestone.completedAt ? (
            <Text style={typography.caption}>Completed {formatDate(milestone.completedAt)}</Text>
          ) : milestone.expectedDate ? (
            <Text style={typography.caption}>Expected by {formatDate(milestone.expectedDate)}</Text>
          ) : null}
          <Text style={typography.caption}>
            {milestone.percent != null ? `${milestone.percent}% done` : ''}
            {milestone.floorsReached ? `  ·  🏢 ${milestone.floorsReached}` : ''}
          </Text>
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

      {/* Updates — each is a small dated entry that can hold multiple photos */}
      {milestone.entries?.length > 0 ? (
        <View style={styles.photosWrap}>
          <Text style={[typography.h3, { marginBottom: spacing.sm }]}>
            Updates · {milestone.entries.length}
          </Text>
          {milestone.entries.map(entry => (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryHead}>
                <Text style={styles.entryTitle}>{entry.title || 'Update'}</Text>
                {entry.entryDate ? (
                  <Text style={typography.caption}>{formatDate(entry.entryDate)}</Text>
                ) : null}
              </View>
              {entry.note ? (
                <Text style={[typography.body, { marginTop: 4 }]}>{entry.note}</Text>
              ) : null}
              {entry.images?.length > 0 ? (
                <View style={styles.entryImages}>
                  {entry.images.map((img, idx) => (
                    <View key={idx} style={styles.entryImageTile}>
                      <Image source={{ uri: img.url }} style={styles.entryImg} resizeMode="cover" />
                      {img.caption ? (
                        <Text style={styles.photoCaption} numberOfLines={2}>{img.caption}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <Text style={[typography.bodyMuted, { marginTop: spacing.md, textAlign: 'center' }]}>
          📷  Updates with photos will appear here as work progresses.
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
  photosWrap: { marginTop: spacing.lg },

  entryCard: {
    backgroundColor: palette.surface,
    borderWidth: 1, borderColor: palette.divider,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  entryHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  entryTitle: { fontSize: 15, fontWeight: '700', color: palette.text, flex: 1, marginRight: spacing.sm },
  entryImages: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm, marginHorizontal: -3 },
  entryImageTile: { width: '50%', paddingHorizontal: 3, marginBottom: spacing.sm },
  entryImg: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.sm, backgroundColor: palette.surfaceAlt },
  photoCaption: { fontSize: 12, fontWeight: '600', color: palette.text, marginTop: 4 },
});
