import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import TempleDetailSheet from '../../components/TempleDetailSheet';
import DarshanBookingSheet from '../../components/DarshanBookingSheet';
import { palette, spacing, typography } from '../../theme';
import { formatDate } from '../../utils/format';
import { loadTemples, loadTemple, loadFestivals, loadMyDarshan, clearActive } from '../../store/slices/templeSlice';

const CROWD = {
  low: { label: 'LOW', variant: 'success' },
  moderate: { label: 'MODERATE', variant: 'info' },
  high: { label: 'HIGH', variant: 'warning' },
  very_high: { label: 'VERY HIGH', variant: 'error' },
};

const SLOT_LABEL = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' };

export default function SpiritualScreen() {
  const dispatch = useDispatch();
  const { temples, templesLoading, festivals, darshanBookings, darshanLoading } = useSelector(s => s.temple);
  const [detailOpen, setDetailOpen] = useState(false);
  const [darshanOpen, setDarshanOpen] = useState(false);
  const [preselect, setPreselect] = useState(null);

  const reload = useCallback(() => {
    dispatch(loadTemples());
    dispatch(loadFestivals());
    dispatch(loadMyDarshan());
  }, [dispatch]);

  useEffect(() => { reload(); }, [reload]);

  const openDetail = temple => { dispatch(loadTemple(temple.id)); setDetailOpen(true); };
  const openDarshan = temple => { setPreselect(temple || null); setDarshanOpen(true); };

  return (
    <ScreenContainer refreshing={templesLoading || darshanLoading} onRefresh={reload}>
      <Card style={styles.hero}>
        <Text style={styles.heroTitle}>🕉️ Vrindavan Temple Directory</Text>
        <Text style={styles.heroSub}>Live crowd status, aarti timings, festivals and darshan + transport booking.</Text>
        <Button title="Book Darshan & Transport" variant="secondary" onPress={() => openDarshan(null)} style={{ marginTop: spacing.md }} />
      </Card>

      {/* Festivals */}
      {festivals.length ? (
        <>
          <Text style={[typography.h3, styles.sectionTitle]}>Festival calendar</Text>
          <Card style={{ marginBottom: spacing.md }}>
            {festivals.slice(0, 5).map((f, i) => (
              <View key={f.id} style={[styles.festRow, i < Math.min(festivals.length, 5) - 1 && styles.divider]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.festName}>{f.name}</Text>
                  <Text style={typography.caption} numberOfLines={1}>{f.significance}</Text>
                </View>
                <Text style={styles.festDate}>{formatDate(f.festivalDate)}</Text>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {/* Temples */}
      <Text style={[typography.h3, styles.sectionTitle]}>Temples</Text>
      {templesLoading && temples.length === 0 ? (
        <><CardSkeleton /><CardSkeleton /></>
      ) : (
        temples.map(t => (
          <TouchableOpacity key={t.id} activeOpacity={0.85} onPress={() => openDetail(t)}>
            <Card style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.name}>{t.name}</Text>
                <StatusChip label={(CROWD[t.crowdStatus] || CROWD.moderate).label} variant={(CROWD[t.crowdStatus] || CROWD.moderate).variant} />
              </View>
              <Text style={typography.caption}>★ {t.rating} · {t.distanceKm} km{t.vipAvailable ? ' · VIP darshan' : ''}</Text>
            </Card>
          </TouchableOpacity>
        ))
      )}

      {/* My darshan */}
      <Text style={[typography.h3, styles.sectionTitle]}>My darshan bookings</Text>
      {darshanLoading && darshanBookings.length === 0 ? (
        <CardSkeleton />
      ) : darshanBookings.length === 0 ? (
        <EmptyState icon="🛕" message="No darshan booked yet." />
      ) : (
        darshanBookings.map(b => (
          <Card key={b.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.name} numberOfLines={1}>{b.temples || 'Darshan'}</Text>
              <StatusChip label={b.isVip ? 'VIP' : 'BOOKED'} variant={b.isVip ? 'primary' : 'info'} />
            </View>
            <Text style={typography.caption}>
              {formatDate(b.visitDate)} · {SLOT_LABEL[b.visitTimeSlot] || b.visitTimeSlot} · {b.persons} pilgrims
              {b.seniorCitizens ? ` (${b.seniorCitizens} senior)` : ''}
            </Text>
            <Text style={styles.code}>{b.bookingCode}</Text>
          </Card>
        ))
      )}

      <TempleDetailSheet
        visible={detailOpen}
        onClose={() => { setDetailOpen(false); dispatch(clearActive()); }}
        onBookDarshan={t => openDarshan(t)}
      />
      <DarshanBookingSheet
        visible={darshanOpen}
        temples={temples}
        preselect={preselect}
        onClose={() => setDarshanOpen(false)}
        onBooked={() => { setDarshanOpen(false); dispatch(loadMyDarshan()); }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: palette.primary, borderColor: palette.primary, marginBottom: spacing.md },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  heroSub: { color: '#DBE3FF', fontSize: 13, marginTop: 6, lineHeight: 19 },

  sectionTitle: { marginBottom: spacing.sm, marginTop: spacing.sm },
  card: { marginBottom: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '700', color: palette.text, flex: 1 },
  code: { fontSize: 11, color: palette.textMuted, marginTop: 4, letterSpacing: 0.4 },

  festRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  divider: { borderBottomWidth: 1, borderBottomColor: palette.divider },
  festName: { fontSize: 14, fontWeight: '700', color: palette.text },
  festDate: { fontSize: 12, fontWeight: '700', color: palette.primary, marginLeft: spacing.sm },
});
