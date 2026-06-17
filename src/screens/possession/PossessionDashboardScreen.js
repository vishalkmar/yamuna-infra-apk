import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import PossessionChecklist from '../../components/PossessionChecklist';
import PossessionAppointmentSheet from '../../components/PossessionAppointmentSheet';
import { palette, radius, spacing, typography } from '../../theme';
import { formatDate } from '../../utils/format';
import { showToast } from '../../utils/toastConfig';
import { loadPossessionStatus } from '../../store/slices/possessionSlice';

const BANNER = {
  pending_clearance: { bg: '#FEF3C7', fg: '#B45309', chip: 'warning', icon: '⏳' },
  ready:             { bg: '#DCFCE7', fg: '#15803D', chip: 'success', icon: '✅' },
  scheduled:         { bg: '#DBEAFE', fg: '#1D4ED8', chip: 'info',    icon: '📅' },
  possessed:         { bg: '#E0E7FF', fg: palette.primary, chip: 'primary', icon: '🏡' },
};

export default function PossessionDashboardScreen() {
  const dispatch = useDispatch();
  const { status, statusLabel, progressPct, checklist, documents, appointment, loading, error } =
    useSelector(s => s.possession);
  const user = useSelector(s => s.auth.user);
  const bookingId = user?.bookingId || user?.primary_booking_id || 'BK-2024-00421';

  const [scheduleOpen, setScheduleOpen] = useState(false);

  const reload = useCallback(() => { dispatch(loadPossessionStatus(bookingId)); }, [dispatch, bookingId]);
  useEffect(() => { reload(); }, [reload]);

  const openDoc = doc => {
    if (!doc.available) {
      showToast('info', 'Not available yet', `${doc.name} will be available once possession is ready.`);
      return;
    }
    Linking.openURL(doc.url).catch(() => showToast('error', "Can't open", doc.name));
  };

  if (loading && !status) {
    return <ScreenContainer><CardSkeleton /><CardSkeleton /></ScreenContainer>;
  }
  if (error && !status) {
    return <ScreenContainer><EmptyState icon="⚠️" title="Couldn't load" message={error} /></ScreenContainer>;
  }

  const banner = BANNER[status] || BANNER.pending_clearance;

  return (
    <ScreenContainer refreshing={loading} onRefresh={reload}>
      {/* Status banner */}
      <View style={[styles.banner, { backgroundColor: banner.bg }]}>
        <Text style={styles.bannerIcon}>{banner.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.bannerLabel, { color: banner.fg }]}>{statusLabel}</Text>
          <Text style={styles.bannerSub}>{progressPct}% of handover checklist complete</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${progressPct}%` }]} />
      </View>

      {/* Appointment (if scheduled) */}
      {appointment ? (
        <Card style={styles.apptCard}>
          <View style={styles.apptTop}>
            <Text style={typography.label}>Your possession appointment</Text>
            <StatusChip label="SCHEDULED" variant="info" />
          </View>
          <Text style={styles.apptDate}>{formatDate(appointment.appointmentDate)}</Text>
          <Text style={typography.caption}>{appointment.timeSlot} · {appointment.attendees} attending</Text>
        </Card>
      ) : null}

      {/* Checklist */}
      <Text style={[typography.h3, styles.sectionTitle]}>Possession checklist</Text>
      <Card style={{ marginBottom: spacing.md }}>
        <PossessionChecklist items={checklist} />
      </Card>

      {/* Documents */}
      <Text style={[typography.h3, styles.sectionTitle]}>Documents</Text>
      <Card style={{ marginBottom: spacing.md }}>
        {documents.length === 0 ? (
          <Text style={typography.bodyMuted}>No documents yet.</Text>
        ) : (
          documents.map((d, i) => (
            <TouchableOpacity
              key={d.id}
              onPress={() => openDoc(d)}
              style={[styles.docRow, i < documents.length - 1 && styles.docDivider]}
            >
              <Text style={styles.docIcon}>{d.available ? '📄' : '🔒'}</Text>
              <Text style={[styles.docName, !d.available && { color: palette.textMuted }]}>{d.name}</Text>
              <Text style={styles.docAction}>{d.available ? 'Download' : 'Locked'}</Text>
            </TouchableOpacity>
          ))
        )}
      </Card>

      {/* Schedule button — only when ready */}
      {status === 'ready' ? (
        <Button title="Schedule Possession Appointment" onPress={() => setScheduleOpen(true)} />
      ) : status === 'scheduled' ? (
        <Button title="Reschedule Appointment" variant="outline" onPress={() => setScheduleOpen(true)} />
      ) : (
        <Text style={styles.pendingNote}>
          The schedule option unlocks once all checklist items are cleared.
        </Text>
      )}

      <PossessionAppointmentSheet
        visible={scheduleOpen}
        bookingId={bookingId}
        onClose={() => setScheduleOpen(false)}
        onBooked={reload}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.sm,
  },
  bannerIcon: { fontSize: 30, marginRight: spacing.md },
  bannerLabel: { fontSize: 18, fontWeight: '800' },
  bannerSub: { fontSize: 12, color: palette.textMuted, marginTop: 2 },

  barTrack: { height: 8, borderRadius: 4, backgroundColor: palette.surfaceAlt, overflow: 'hidden', marginBottom: spacing.lg },
  barFill: { height: '100%', backgroundColor: palette.accent, borderRadius: 4 },

  apptCard: { marginBottom: spacing.md, backgroundColor: '#F5F8FF' },
  apptTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  apptDate: { fontSize: 16, fontWeight: '800', color: palette.text },

  sectionTitle: { marginBottom: spacing.sm },

  docRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  docDivider: { borderBottomWidth: 1, borderBottomColor: palette.divider },
  docIcon: { fontSize: 18, marginRight: spacing.md },
  docName: { flex: 1, fontSize: 14, fontWeight: '600', color: palette.text },
  docAction: { fontSize: 12, fontWeight: '700', color: palette.primary },

  pendingNote: { ...typography.caption, textAlign: 'center', paddingHorizontal: spacing.lg },
});
