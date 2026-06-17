import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import ReportSnagSheet from '../../components/ReportSnagSheet';
import { palette, radius, spacing, typography } from '../../theme';
import { formatDate } from '../../utils/format';
import { showToast } from '../../utils/toastConfig';
import { loadSnags, signoffSnag } from '../../store/slices/snagSlice';

const FILTERS = [
  { key: null,          label: 'All' },
  { key: 'open',        label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved',    label: 'Resolved' },
  { key: 'signed_off',  label: 'Signed Off' },
];

const STATUS_VARIANT = {
  open: 'info', in_progress: 'warning', resolved: 'success', signed_off: 'primary',
};
const SEVERITY_VARIANT = { critical: 'error', major: 'warning', minor: 'neutral' };

export default function SnagScreen() {
  const dispatch = useDispatch();
  const { snags, loading, signoffBusy } = useSelector(s => s.snag);
  const user = useSelector(s => s.auth.user);
  const bookingId = user?.bookingId || user?.primary_booking_id || 'BK-2024-00421';

  const [filter, setFilter] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);

  const reload = useCallback(() => {
    dispatch(loadSnags({ bookingId, status: filter || undefined }));
  }, [dispatch, bookingId, filter]);

  useEffect(() => { reload(); }, [reload]);

  const onSignoff = async snag => {
    try {
      await dispatch(signoffSnag({ bookingId, snagId: snag.id })).unwrap();
      showToast('success', 'Signed off', 'Thanks for confirming the fix!');
    } catch (e) {
      showToast('error', 'Could not sign off', String(e));
    }
  };

  return (
    <ScreenContainer refreshing={loading} onRefresh={reload}>
      <Card style={styles.hero}>
        <Text style={styles.heroTitle}>Home Inspection & Snags</Text>
        <Text style={styles.heroSub}>
          Report any defect before move-in. We resolve every snag before handover.
        </Text>
        <Button
          title="＋ Report a Snag"
          variant="secondary"
          onPress={() => setReportOpen(true)}
          style={{ marginTop: spacing.md }}
        />
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          return (
            <TouchableOpacity key={f.label} onPress={() => setFilter(f.key)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading && snags.length === 0 ? (
        <><CardSkeleton /><CardSkeleton /></>
      ) : snags.length === 0 ? (
        <EmptyState icon="🛠️" title="No snags here" message="Report a defect and track its resolution here." />
      ) : (
        snags.map(s => (
          <Card key={s.id} style={styles.snagCard}>
            <View style={styles.topRow}>
              <Text style={styles.code}>{s.snagCode}</Text>
              <View style={styles.chips}>
                <StatusChip label={s.severity.toUpperCase()} variant={SEVERITY_VARIANT[s.severity] || 'neutral'} />
                <StatusChip
                  label={String(s.status).replace('_', ' ').toUpperCase()}
                  variant={STATUS_VARIANT[s.status] || 'neutral'}
                  style={{ marginLeft: 6 }}
                />
              </View>
            </View>
            <Text style={styles.loc}>{s.location} · {s.defectType}</Text>
            <Text style={typography.body} numberOfLines={3}>{s.description}</Text>

            {s.photos?.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
                {s.photos.map(uri => (
                  <Image key={uri} source={{ uri }} style={styles.photo} />
                ))}
              </ScrollView>
            ) : null}

            <View style={styles.metaRow}>
              <Text style={styles.meta}>Reported {formatDate(s.createdAt)}</Text>
              {s.status === 'resolved' ? (
                <TouchableOpacity style={styles.signoffBtn} disabled={signoffBusy} onPress={() => onSignoff(s)}>
                  <Text style={styles.signoffText}>Sign off ✓</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </Card>
        ))
      )}

      <ReportSnagSheet
        visible={reportOpen}
        bookingId={bookingId}
        onClose={() => setReportOpen(false)}
        onReported={() => { setReportOpen(false); reload(); }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: palette.primary, borderColor: palette.primary, marginBottom: spacing.md },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  heroSub: { color: '#DBE3FF', fontSize: 13, marginTop: 6, lineHeight: 19 },

  chipRow: { paddingVertical: spacing.xs, gap: spacing.sm, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill,
    borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: palette.textMuted },
  chipTextActive: { color: '#fff' },

  snagCard: { marginBottom: spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  chips: { flexDirection: 'row', alignItems: 'center' },
  code: { fontSize: 12, fontWeight: '700', color: palette.textMuted, letterSpacing: 0.4 },
  loc: { fontSize: 14, fontWeight: '700', color: palette.text, marginBottom: 4, textTransform: 'capitalize' },
  photo: { width: 84, height: 60, borderRadius: radius.sm, marginRight: spacing.sm, backgroundColor: palette.surfaceAlt },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  meta: { fontSize: 11, color: palette.textMuted },
  signoffBtn: {
    paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: '#15803D',
  },
  signoffText: { color: '#15803D', fontWeight: '700', fontSize: 13 },
});
