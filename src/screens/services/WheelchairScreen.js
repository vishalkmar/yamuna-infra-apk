import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import MobilityBookingSheet from '../../components/MobilityBookingSheet';
import { palette, radius, spacing, typography } from '../../theme';
import { formatDate } from '../../utils/format';
import { loadAids, loadBookings } from '../../store/slices/mobilitySlice';

const CATEGORIES = [
  { key: null, label: 'All' },
  { key: 'wheelchair', label: 'Wheelchairs' },
  { key: 'walker', label: 'Walkers' },
  { key: 'scooter', label: 'Scooters' },
  { key: 'support', label: 'Support' },
  { key: 'bed', label: 'Beds' },
];

const CAT_ICON = { wheelchair: '🦽', walker: '🚶', scooter: '🛵', support: '🦯', bed: '🛏️' };

export default function WheelchairScreen() {
  const dispatch = useDispatch();
  const { aids, aidsLoading, bookings, bookingsLoading } = useSelector(s => s.mobility);
  const [category, setCategory] = useState(null);
  const [bookAidItem, setBookAidItem] = useState(null);

  const reload = useCallback(() => {
    dispatch(loadAids({ category: category || undefined }));
    dispatch(loadBookings());
  }, [dispatch, category]);

  useEffect(() => { reload(); }, [reload]);

  return (
    <ScreenContainer refreshing={aidsLoading || bookingsLoading} onRefresh={reload}>
      <Card style={styles.hero}>
        <Text style={styles.heroTitle}>🦽 Mobility Assistance</Text>
        <Text style={styles.heroSub}>Rent or buy mobility aids — with optional trained attendant, delivered home.</Text>
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {CATEGORIES.map(c => {
          const active = category === c.key;
          return (
            <TouchableOpacity key={c.label} onPress={() => setCategory(c.key)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={[typography.h3, styles.sectionTitle]}>Available aids</Text>
      {aidsLoading && aids.length === 0 ? (
        <><CardSkeleton /><CardSkeleton /></>
      ) : aids.length === 0 ? (
        <EmptyState icon="🦽" message="No aids in this category." />
      ) : (
        aids.map(a => (
          <Card key={a.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.name}>{CAT_ICON[a.category] || '•'} {a.name}</Text>
              {a.attendantAvailable ? <StatusChip label="ATTENDANT" variant="primary" /> : null}
            </View>
            <Text style={typography.caption}>{a.description}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>₹{a.rentPerDay}/day{a.buyPrice ? ` · Buy ₹${a.buyPrice}` : ''}</Text>
              <TouchableOpacity style={styles.bookBtn} onPress={() => setBookAidItem(a)}>
                <Text style={styles.bookText}>Rent / Buy</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))
      )}

      <Text style={[typography.h3, styles.sectionTitle]}>My bookings</Text>
      {bookingsLoading && bookings.length === 0 ? (
        <CardSkeleton />
      ) : bookings.length === 0 ? (
        <EmptyState icon="🧾" message="No mobility bookings yet." />
      ) : (
        bookings.map(b => (
          <Card key={b.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.name}>{b.aidName}</Text>
              <StatusChip label={String(b.status).toUpperCase()} variant="success" />
            </View>
            <Text style={typography.caption}>
              {b.mode === 'buy' ? 'Purchase' : `Rental · ${b.days} ${b.days === 1 ? 'day' : 'days'}`}
              {b.withAttendant ? ' · + attendant' : ''} · from {formatDate(b.startDate)}
            </Text>
            <Text style={styles.total}>₹{b.total}</Text>
          </Card>
        ))
      )}

      <MobilityBookingSheet
        visible={!!bookAidItem}
        aid={bookAidItem}
        onClose={() => setBookAidItem(null)}
        onBooked={() => { setBookAidItem(null); dispatch(loadBookings()); }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: palette.primary, borderColor: palette.primary, marginBottom: spacing.md },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  heroSub: { color: '#DBE3FF', fontSize: 13, marginTop: 6, lineHeight: 19 },

  chipRow: { paddingVertical: spacing.xs, gap: spacing.sm, marginBottom: spacing.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, marginRight: spacing.sm },
  chipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: palette.textMuted },
  chipTextActive: { color: '#fff' },

  sectionTitle: { marginBottom: spacing.sm, marginTop: spacing.sm },
  card: { marginBottom: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '700', color: palette.text, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  meta: { fontSize: 12, color: palette.textMuted, flex: 1 },
  bookBtn: { paddingHorizontal: spacing.lg, paddingVertical: 8, borderRadius: radius.md, backgroundColor: palette.primary },
  bookText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  total: { fontSize: 14, fontWeight: '800', color: palette.primary, marginTop: 4 },
});
