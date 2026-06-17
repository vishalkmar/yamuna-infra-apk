import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import WellnessBookingSheet from '../../components/WellnessBookingSheet';
import { palette, radius, spacing, typography } from '../../theme';
import { formatDate } from '../../utils/format';
import { loadTherapies, loadBookings } from '../../store/slices/wellnessSlice';

export default function WellnessScreen() {
  const dispatch = useDispatch();
  const { therapies, therapiesLoading, bookings, bookingsLoading } = useSelector(s => s.wellness);
  const [therapy, setTherapy] = useState(null);

  const reload = useCallback(() => {
    dispatch(loadTherapies());
    dispatch(loadBookings());
  }, [dispatch]);

  useEffect(() => { reload(); }, [reload]);

  return (
    <ScreenContainer refreshing={therapiesLoading || bookingsLoading} onRefresh={reload}>
      <Card style={styles.hero}>
        <Text style={styles.heroTitle}>🌿 Ayurvedic Wellness & Spa</Text>
        <Text style={styles.heroSub}>Abhyanga, Shirodhara, Panchakarma, Yoga & Meditation at the Wellness Center.</Text>
      </Card>

      <Text style={[typography.h3, styles.sectionTitle]}>Choose a therapy</Text>
      {therapiesLoading && therapies.length === 0 ? (
        <><CardSkeleton /><CardSkeleton /></>
      ) : (
        <View style={styles.grid}>
          {therapies.map(t => (
            <TouchableOpacity key={t.id} style={styles.tile} activeOpacity={0.85} onPress={() => setTherapy(t)}>
              <Text style={styles.tileIcon}>{t.icon}</Text>
              <Text style={styles.tileName}>{t.name}</Text>
              <Text style={styles.tilePrice}>₹{t.price}{t.isPackage ? ` · ${t.packageDays}d` : ''}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={[typography.h3, styles.sectionTitle]}>My bookings</Text>
      {bookingsLoading && bookings.length === 0 ? (
        <CardSkeleton />
      ) : bookings.length === 0 ? (
        <EmptyState icon="🧘" message="No wellness sessions booked yet." />
      ) : (
        bookings.map(b => (
          <Card key={b.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.name}>{b.icon} {b.therapyName}</Text>
              <StatusChip label={b.isPackage ? 'PACKAGE' : 'SESSION'} variant={b.isPackage ? 'primary' : 'info'} />
            </View>
            <Text style={typography.caption}>
              {formatDate(b.visitDate)} at {b.timeSlot} · {b.durationMin} min
              {b.therapistGender !== 'any' ? ` · ${b.therapistGender}` : ''}
            </Text>
            {b.healthNote ? <Text style={styles.note}>“{b.healthNote}”</Text> : null}
          </Card>
        ))
      )}

      <WellnessBookingSheet
        visible={!!therapy}
        therapy={therapy}
        onClose={() => setTherapy(null)}
        onBooked={() => { setTherapy(null); dispatch(loadBookings()); }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: palette.primary, borderColor: palette.primary, marginBottom: spacing.md },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  heroSub: { color: '#DBE3FF', fontSize: 13, marginTop: 6, lineHeight: 19 },

  sectionTitle: { marginBottom: spacing.sm, marginTop: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: {
    width: '48.5%', backgroundColor: palette.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: palette.divider, padding: spacing.lg,
    marginBottom: spacing.sm, alignItems: 'flex-start',
  },
  tileIcon: { fontSize: 30, marginBottom: 6 },
  tileName: { fontSize: 15, fontWeight: '700', color: palette.text },
  tilePrice: { fontSize: 12, color: palette.textMuted, marginTop: 2 },

  card: { marginBottom: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '700', color: palette.text },
  note: { fontSize: 12, color: palette.textMuted, fontStyle: 'italic', marginTop: 6 },
});
