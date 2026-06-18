import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Linking } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import CircularProgress from '../../components/CircularProgress';
import MilestoneTimeline from '../../components/MilestoneTimeline';
import MilestoneDetailSheet from '../../components/MilestoneDetailSheet';
import { palette, radius, spacing, typography } from '../../theme';
import { formatDate } from '../../utils/format';
import { loadProgress, loadUpdates, loadMyProperties, selectProperty } from '../../store/slices/projectSlice';

export default function ConstructionTrackerScreen() {
  const dispatch = useDispatch();
  const {
    project, properties, selectedPropertyId, progressPct, currentMilestone, milestones, counts,
    updates, loading, propertiesLoading, updatesLoading, error,
  } = useSelector(s => s.project);

  const propertyId = selectedPropertyId;
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(null);

  // Resolve the resident's properties once.
  useEffect(() => { dispatch(loadMyProperties()); }, [dispatch]);

  const reload = useCallback(() => {
    if (!propertyId) return;
    dispatch(loadProgress(propertyId));
    dispatch(loadUpdates({ propertyId, limit: 12 }));
  }, [dispatch, propertyId]);

  useEffect(() => { reload(); }, [reload]);

  if ((loading || propertiesLoading) && milestones.length === 0 && !propertyId) {
    return (
      <ScreenContainer>
        <CardSkeleton />
        <CardSkeleton />
      </ScreenContainer>
    );
  }

  if (!propertyId && !propertiesLoading) {
    return (
      <ScreenContainer refreshing={propertiesLoading} onRefresh={() => dispatch(loadMyProperties())}>
        <EmptyState
          icon="🏠"
          title="No property yet"
          message="No property is linked to your account yet. Please contact the office."
        />
      </ScreenContainer>
    );
  }

  if (error && milestones.length === 0) {
    return (
      <ScreenContainer>
        <EmptyState
          icon="⚠️"
          title="Couldn't load progress"
          message={error}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer refreshing={loading} onRefresh={reload}>
      {/* Property switcher (when the resident owns more than one) */}
      {properties.length > 1 ? (
        <View style={styles.switcher}>
          {properties.map(p => {
            const active = p.id === selectedPropertyId;
            return (
              <Text
                key={p.id}
                onPress={() => dispatch(selectProperty(p.id))}
                style={[styles.switchChip, active && styles.switchChipActive]}
              >
                {p.label || p.flatNo || `Unit ${p.id}`}
              </Text>
            );
          })}
        </View>
      ) : null}

      {/* Hero */}
      <Card style={styles.hero}>
        <View style={styles.heroRow}>
          <CircularProgress
            percent={progressPct}
            size={140}
            thickness={12}
            label="OVERALL"
            color={palette.accent}
            trackColor="rgba(255,255,255,0.15)"
            textColor="#fff"
          />
          <View style={styles.heroMeta}>
            <Text style={styles.projectName}>{project?.name || 'Project'}</Text>
            {currentMilestone ? (
              <>
                <Text style={styles.currentLabel}>CURRENT STAGE</Text>
                <Text style={styles.currentName}>{currentMilestone.name}</Text>
                {currentMilestone.expectedDate ? (
                  <Text style={styles.heroDate}>
                    Expected {formatDate(currentMilestone.expectedDate)}
                  </Text>
                ) : null}
              </>
            ) : null}
          </View>
        </View>
        <View style={styles.countsRow}>
          <CountPill label="Done"     value={counts.completed}    color="#86EFAC" />
          <CountPill label="On-going" value={counts.in_progress}  color="#FCD34D" />
          <CountPill label="Pending"  value={counts.pending}      color="rgba(255,255,255,0.45)" />
        </View>
      </Card>

      {/* Timeline */}
      <Text style={[typography.h3, styles.sectionTitle]}>Milestones</Text>
      <Card style={{ marginBottom: spacing.md }}>
        <MilestoneTimeline
          milestones={milestones}
          onSelect={m => setSelectedMilestoneId(m.id)}
        />
      </Card>

      {/* Updates */}
      <Text style={[typography.h3, styles.sectionTitle]}>Weekly updates</Text>
      {updatesLoading && updates.length === 0 ? (
        <CardSkeleton />
      ) : updates.length === 0 ? (
        <EmptyState icon="📰" message="No project updates yet." />
      ) : (
        <FlatList
          data={updates}
          keyExtractor={u => String(u.id)}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => <UpdateRow update={item} />}
        />
      )}

      <MilestoneDetailSheet
        visible={!!selectedMilestoneId}
        propertyId={propertyId}
        milestoneId={selectedMilestoneId}
        onClose={() => setSelectedMilestoneId(null)}
      />
    </ScreenContainer>
  );
}

function CountPill({ label, value, color }) {
  return (
    <View style={styles.pill}>
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
  );
}

function UpdateRow({ update }) {
  const open = () => {
    if (update.mediaUrl) Linking.openURL(update.mediaUrl).catch(() => {});
  };
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={open}>
      <Card padded>
        <View style={styles.updRow}>
          <View style={styles.updThumbWrap}>
            <Image
              source={{ uri: update.mediaUrl }}
              style={styles.updThumb}
              resizeMode="cover"
            />
            {update.mediaType === 'video' ? (
              <View style={styles.playOverlay}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
            ) : null}
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={typography.label} numberOfLines={2}>{update.title}</Text>
            {update.description ? (
              <Text style={typography.caption} numberOfLines={2}>{update.description}</Text>
            ) : null}
            <View style={styles.updMetaRow}>
              <Text style={typography.caption}>{formatDate(update.postedAt)}</Text>
              <StatusChip
                label={update.mediaType.toUpperCase()}
                variant={update.mediaType === 'video' ? 'info' : 'neutral'}
              />
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
    marginBottom: spacing.lg,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroMeta: { flex: 1, marginLeft: spacing.md },
  projectName: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 8 },
  currentLabel: { color: '#A8B2D4', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  currentName: { color: '#fff', fontSize: 17, fontWeight: '700', marginTop: 2 },
  heroDate: { color: '#DBE3FF', fontSize: 12, marginTop: 4 },
  countsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },

  pill: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: 10, paddingVertical: 6,
    marginHorizontal: 3,
  },
  pillDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  pillLabel: { color: '#DBE3FF', fontSize: 11, fontWeight: '600', flex: 1 },
  pillValue: { color: '#fff', fontSize: 12, fontWeight: '800' },

  switcher: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  switchChip: {
    fontSize: 12, fontWeight: '700', color: palette.textMuted,
    backgroundColor: palette.surfaceAlt, borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 6, marginRight: 6, marginBottom: 6,
    overflow: 'hidden',
  },
  switchChipActive: { backgroundColor: palette.primary, color: '#fff' },

  sectionTitle: { marginBottom: spacing.sm, marginTop: spacing.md },

  updRow: { flexDirection: 'row', alignItems: 'flex-start' },
  updThumbWrap: { width: 88, height: 64, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: palette.surfaceAlt },
  updThumb: { width: '100%', height: '100%' },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  playIcon: { color: '#fff', fontSize: 20 },
  updMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
});
