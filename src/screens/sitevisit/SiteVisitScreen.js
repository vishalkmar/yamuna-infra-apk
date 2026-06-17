import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import VirtualTourSection from '../../components/VirtualTourSection';
import BookVisitSheet from '../../components/BookVisitSheet';
import { palette, radius, spacing, typography } from '../../theme';
import { formatDate } from '../../utils/format';
import {
  loadVirtualTours,
  loadMyVisits,
  cancelVisit,
} from '../../store/slices/siteVisitSlice';
import { showToast } from '../../utils/toastConfig';

const DEFAULT_PROJECT_ID = 1; // Vrindavan Heights — resolved from booking in real flow.

const STATUS_VARIANT = {
  booked: 'info',
  rescheduled: 'warning',
  completed: 'success',
  cancelled: 'error',
};

const TYPE_LABEL = {
  personal: 'Personal',
  family: 'With family',
  banker: 'With banker',
};

export function to12h(t24) {
  if (!t24) return '';
  const [hh, mm] = String(t24).split(':').map(Number);
  const period = hh >= 12 ? 'PM' : 'AM';
  const hh12 = ((hh + 11) % 12) + 1;
  return `${hh12}:${String(mm).padStart(2, '0')} ${period}`;
}

export default function SiteVisitScreen() {
  const dispatch = useDispatch();
  const { tours, toursLoading, visits, visitsLoading, cancelBusy } = useSelector(s => s.siteVisit);

  const projectId = DEFAULT_PROJECT_ID;
  const [bookOpen, setBookOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);

  const reload = useCallback(() => {
    dispatch(loadVirtualTours(projectId));
    dispatch(loadMyVisits({}));
  }, [dispatch, projectId]);

  useEffect(() => { reload(); }, [reload]);

  const onCancel = visit => {
    Alert.alert(
      'Cancel site visit?',
      `Visit on ${formatDate(visit.visitDate)} at ${to12h(visit.visitTime)} will be cancelled.`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel visit',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(cancelVisit({ visitId: visit.id })).unwrap();
              showToast('warning', 'Visit cancelled', 'To reschedule, tap the Reschedule button.');
            } catch (e) {
              showToast('error', 'Could not cancel', String(e));
            }
          },
        },
      ],
    );
  };

  const upcoming = visits.filter(v => v.status === 'booked' || v.status === 'rescheduled');
  const past = visits.filter(v => v.status === 'completed' || v.status === 'cancelled');

  return (
    <ScreenContainer refreshing={visitsLoading || toursLoading} onRefresh={reload}>
      {/* Hero / intro */}
      <Card style={styles.hero}>
        <Text style={styles.heroTitle}>Site Visit & Virtual Tour</Text>
        <Text style={styles.heroSub}>
          Book a personal visit to Vrindavan Heights, or explore from anywhere with a 360° tour.
        </Text>
        <Button
          title="Book a Site Visit"
          variant="secondary"
          onPress={() => setBookOpen(true)}
          style={{ marginTop: spacing.md }}
        />
      </Card>

      {/* Virtual tours */}
      {toursLoading && tours.length === 0 ? <CardSkeleton /> : <VirtualTourSection tours={tours} />}

      {/* Upcoming visits */}
      <Text style={[typography.h3, styles.sectionTitle]}>Upcoming visits</Text>
      {visitsLoading && visits.length === 0 ? (
        <CardSkeleton />
      ) : upcoming.length === 0 ? (
        <EmptyState icon="📅" message="No upcoming visits. Book one above!" />
      ) : (
        upcoming.map(v => (
          <VisitCard
            key={v.id}
            visit={v}
            cancelBusy={cancelBusy}
            onReschedule={() => setRescheduleTarget(v)}
            onCancel={() => onCancel(v)}
          />
        ))
      )}

      {/* Past visits */}
      {past.length > 0 ? (
        <>
          <Text style={[typography.h3, styles.sectionTitle]}>Past visits</Text>
          {past.map(v => <VisitCard key={v.id} visit={v} />)}
        </>
      ) : null}

      {/* Book sheet */}
      <BookVisitSheet
        visible={bookOpen}
        projectId={projectId}
        onClose={() => setBookOpen(false)}
        onBooked={() => { setBookOpen(false); reload(); }}
      />

      {/* Reschedule sheet (same form, reschedule mode) */}
      <BookVisitSheet
        visible={!!rescheduleTarget}
        projectId={projectId}
        rescheduleVisit={rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        onBooked={() => { setRescheduleTarget(null); reload(); }}
      />
    </ScreenContainer>
  );
}

function VisitCard({ visit, cancelBusy, onReschedule, onCancel }) {
  const actionable = visit.status === 'booked' || visit.status === 'rescheduled';
  return (
    <Card style={styles.visitCard}>
      <View style={styles.visitTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.visitDate}>
            {formatDate(visit.visitDate)} · {to12h(visit.visitTime)}
          </Text>
          <Text style={typography.caption}>
            {visit.projectName} · {TYPE_LABEL[visit.visitType] || visit.visitType} · {visit.visitorCount}
            {visit.visitorCount === 1 ? ' person' : ' persons'}
          </Text>
          {visit.confirmationCode ? (
            <Text style={styles.code}>{visit.confirmationCode}</Text>
          ) : null}
        </View>
        <StatusChip
          label={String(visit.status).toUpperCase()}
          variant={STATUS_VARIANT[visit.status] || 'neutral'}
        />
      </View>

      {actionable ? (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={onReschedule}>
            <Text style={styles.actionText}>Reschedule</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.cancelBtn]}
            disabled={cancelBusy}
            onPress={onCancel}
          >
            <Text style={[styles.actionText, styles.cancelText]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: palette.primary, borderColor: palette.primary, marginBottom: spacing.lg },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  heroSub: { color: '#DBE3FF', fontSize: 13, marginTop: 6, lineHeight: 19 },

  sectionTitle: { marginBottom: spacing.sm, marginTop: spacing.md },

  visitCard: { marginBottom: spacing.sm },
  visitTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  visitDate: { fontSize: 15, fontWeight: '700', color: palette.text },
  code: { fontSize: 11, color: palette.textMuted, marginTop: 4, letterSpacing: 0.4 },

  actions: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: palette.primary,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  actionText: { color: palette.primary, fontWeight: '700', fontSize: 13 },
  cancelBtn: { borderColor: palette.error, marginRight: 0 },
  cancelText: { color: palette.error },
});
