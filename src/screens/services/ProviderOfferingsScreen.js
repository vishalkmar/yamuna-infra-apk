import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import ServiceBookingSheet from '../../components/ServiceBookingSheet';
import { palette, radius, spacing, typography } from '../../theme';
import { formatINR } from '../../utils/format';

// Drill-down: a single provider's bookable offerings, each with its own Book
// button. Reached by tapping a provider card on any service category screen.
export default function ProviderOfferingsScreen({ route }) {
  const { provider, category, categoryLabel } = route.params || {};
  const [offering, setOffering] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const offerings = provider?.offerings || [];

  const book = o => { setOffering(o); setSheetOpen(true); };

  return (
    <ScreenContainer>
      <Card style={styles.hero}>
        <View style={styles.heroTop}>
          <Text style={styles.heroName}>{provider?.name}</Text>
          <Text style={styles.rating}>★ {provider?.rating}</Text>
        </View>
        <Text style={styles.heroSub}>{provider?.tagline}</Text>
        <Text style={styles.heroMeta}>
          {provider?.experienceYears} yrs exp{provider?.gender && provider.gender !== 'any' ? ` · ${provider.gender}` : ''}
          {provider?.phone ? ` · 📞 ${provider.phone}` : ''}
        </Text>
      </Card>

      <Text style={[typography.h3, styles.sectionTitle]}>Services offered</Text>
      {offerings.length === 0 ? (
        <EmptyState icon="🧾" message="This provider hasn't listed services yet." />
      ) : offerings.map(o => (
        <Card key={o.id} style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.name}>{o.name}</Text>
            <Text style={styles.price}>{formatINR(o.price)}{o.unit ? `/${o.unit}` : ''}</Text>
          </View>
          <Text style={typography.caption}>{o.description}</Text>
          <TouchableOpacity style={styles.bookBtn} onPress={() => book(o)}>
            <Text style={styles.bookText}>Book now</Text>
          </TouchableOpacity>
        </Card>
      ))}

      <ServiceBookingSheet
        visible={sheetOpen}
        category={category}
        categoryLabel={categoryLabel}
        provider={provider}
        offering={offering}
        onClose={() => setSheetOpen(false)}
        onBooked={() => setSheetOpen(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: palette.primary, borderColor: palette.primary, marginBottom: spacing.md },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroName: { fontSize: 18, fontWeight: '800', color: '#fff', flex: 1 },
  rating: { fontSize: 14, fontWeight: '800', color: '#FCD34D' },
  heroSub: { color: '#DBE3FF', fontSize: 13, marginTop: 6 },
  heroMeta: { color: '#DBE3FF', fontSize: 12, marginTop: 6 },

  sectionTitle: { marginBottom: spacing.sm },
  card: { marginBottom: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '700', color: palette.text, flex: 1, marginRight: spacing.sm },
  price: { fontSize: 14, fontWeight: '800', color: palette.primary },
  bookBtn: { alignSelf: 'flex-start', marginTop: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: 8, borderRadius: radius.md, backgroundColor: palette.primary },
  bookText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
