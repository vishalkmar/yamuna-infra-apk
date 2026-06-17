import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import ServiceBookingSheet from '../../components/ServiceBookingSheet';
import { palette, spacing, typography } from '../../theme';
import { formatDate } from '../../utils/format';
import { isRecurring, frequencyLabel } from '../../utils/serviceFreq';
import { loadProviders, loadMyBookings } from '../../store/slices/servicesSlice';

const CATEGORY = 'housekeeping';
const CATEGORY_LABEL = 'Housekeeping';

const TIME_LABEL = { morning: 'Morning 8–10', afternoon: 'Afternoon 12–2', evening: 'Evening 5–7' };

export default function HousekeepingScreen({ navigation }) {
  const dispatch = useDispatch();
  const { providers, providersLoading, bookings, bookingsLoading } = useSelector(s => s.services);
  const [sheetProvider, setSheetProvider] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const reload = useCallback(() => {
    dispatch(loadProviders({ category: CATEGORY }));
    dispatch(loadMyBookings({ category: CATEGORY }));
  }, [dispatch]);

  useEffect(() => { reload(); }, [reload]);

  const openSheet = provider => { setSheetProvider(provider); setSheetOpen(true); };
  const openProvider = provider =>
    navigation.navigate('ProviderOfferings', { provider, category: CATEGORY, categoryLabel: CATEGORY_LABEL });

  return (
    <ScreenContainer refreshing={providersLoading || bookingsLoading} onRefresh={reload}>
      <Card style={styles.hero}>
        <Text style={styles.heroTitle}>🧺 Housekeeping & Domestic Help</Text>
        <Text style={styles.heroSub}>
          Trusted maids, cooks and attendants — book one-time or as a monthly subscription.
        </Text>
        <Button title="Book Domestic Help" variant="secondary" onPress={() => openSheet(null)} style={{ marginTop: spacing.md }} />
      </Card>

      <Text style={[typography.h3, styles.sectionTitle]}>Available help</Text>
      {providersLoading && providers.length === 0 ? (
        <><CardSkeleton /><CardSkeleton /></>
      ) : providers.length === 0 ? (
        <EmptyState icon="🧺" message="No domestic help available right now." />
      ) : (
        providers.map(p => (
          <TouchableOpacity key={p.id} activeOpacity={0.7} onPress={() => openProvider(p)}>
            <Card style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.rating}>★ {p.rating}</Text>
              </View>
              <Text style={typography.caption}>{p.tagline}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>
                  {p.experienceYears} yrs exp{p.gender !== 'any' ? ` · ${p.gender}` : ''} · from ₹{p.priceFrom}/mo
                </Text>
                <Text style={styles.viewLink}>View services ›</Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}

      <Text style={[typography.h3, styles.sectionTitle]}>My bookings</Text>
      {bookingsLoading && bookings.length === 0 ? (
        <CardSkeleton />
      ) : bookings.length === 0 ? (
        <EmptyState icon="🗓️" message="No domestic help booked yet." />
      ) : (
        bookings.map(b => (
          <Card key={b.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.name}>{formatDate(b.startDate)}</Text>
              <StatusChip
                label={isRecurring(b.frequency) ? 'SUBSCRIPTION' : 'ONE-TIME'}
                variant={isRecurring(b.frequency) ? 'primary' : 'info'}
              />
            </View>
            <Text style={typography.caption}>
              {frequencyLabel(b.frequency)} · {TIME_LABEL[b.preferredTime] || b.preferredTime}
              {b.providerName ? ` · ${b.providerName}` : ''}
            </Text>
            {b.specialNotes ? <Text style={styles.notes}>“{b.specialNotes}”</Text> : null}
          </Card>
        ))
      )}

      <ServiceBookingSheet
        visible={sheetOpen}
        category={CATEGORY}
        categoryLabel={CATEGORY_LABEL}
        provider={sheetProvider}
        onClose={() => setSheetOpen(false)}
        onBooked={() => { setSheetOpen(false); dispatch(loadMyBookings({ category: CATEGORY })); }}
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
  name: { fontSize: 15, fontWeight: '700', color: palette.text },
  rating: { fontSize: 13, fontWeight: '700', color: palette.accent },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  meta: { fontSize: 12, color: palette.textMuted, flex: 1 },
  viewLink: { color: palette.primary, fontWeight: '700', fontSize: 13 },
  notes: { fontSize: 12, color: palette.textMuted, fontStyle: 'italic', marginTop: 6 },
});
