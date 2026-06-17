import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import PreAuthGuestSheet from '../../components/PreAuthGuestSheet';
import AmenityBookingSheet from '../../components/AmenityBookingSheet';
import { palette, radius, spacing, typography } from '../../theme';
import { formatDate } from '../../utils/format';
import {
  loadAnnouncements, loadEvents, loadVisitors, loadAmenities, loadAmenityBookings,
} from '../../store/slices/communitySlice';

const TABS = [
  { key: 'feed', label: 'Feed' },
  { key: 'visitors', label: 'Visitors' },
  { key: 'amenities', label: 'Amenities' },
];

const PURPOSE_LABEL = { personal: 'Personal', delivery: 'Delivery', service: 'Service', medical: 'Medical' };

export default function CommunityScreen() {
  const dispatch = useDispatch();
  const {
    announcements, events, feedLoading, visitors, visitorsLoading,
    amenities, amenitiesLoading, amenityBookings,
  } = useSelector(s => s.community);

  const [tab, setTab] = useState('feed');
  const [guestOpen, setGuestOpen] = useState(false);
  const [bookAmenityItem, setBookAmenityItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  const changeTab = key => { setTab(key); setActiveCategory(null); };

  const reload = useCallback(() => {
    dispatch(loadAnnouncements());
    dispatch(loadEvents());
    dispatch(loadVisitors());
    dispatch(loadAmenities());
    dispatch(loadAmenityBookings());
  }, [dispatch]);

  useEffect(() => { reload(); }, [reload]);

  const loading = feedLoading || visitorsLoading || amenitiesLoading;

  return (
    <ScreenContainer refreshing={loading} onRefresh={reload}>
      <Card style={styles.hero}>
        <Text style={styles.heroTitle}>🏘️ Resident Community</Text>
        <Text style={styles.heroSub}>Announcements, events, visitor passes and clubhouse bookings.</Text>
      </Card>

      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[styles.tab, tab === t.key && styles.tabActive]} onPress={() => changeTab(t.key)}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* FEED */}
      {tab === 'feed' ? (
        <>
          <Text style={[typography.h3, styles.sectionTitle]}>Announcements</Text>
          {feedLoading && announcements.length === 0 ? <CardSkeleton /> : announcements.map(a => (
            <Card key={a.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.name}>{a.pinned ? '📌 ' : ''}{a.title}</Text>
                {a.category ? <StatusChip label={String(a.category).toUpperCase()} variant="neutral" /> : null}
              </View>
              <Text style={typography.body}>{a.body}</Text>
              <Text style={styles.meta}>{formatDate(a.postedAt)}</Text>
            </Card>
          ))}

          <Text style={[typography.h3, styles.sectionTitle]}>Upcoming events</Text>
          {events.length === 0 ? <EmptyState icon="📅" message="No events scheduled." /> : events.map(e => (
            <Card key={e.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.name}>{e.title}</Text>
                <Text style={styles.eventDate}>{formatDate(e.eventDate)}</Text>
              </View>
              <Text style={typography.caption}>{e.description}{e.location ? ` · 📍 ${e.location}` : ''}</Text>
            </Card>
          ))}
        </>
      ) : null}

      {/* VISITORS */}
      {tab === 'visitors' ? (
        <>
          <Button title="＋ Pre-authorize a Guest" variant="secondary" onPress={() => setGuestOpen(true)} />
          <View style={{ height: spacing.md }} />
          {visitorsLoading && visitors.length === 0 ? (
            <CardSkeleton />
          ) : visitors.length === 0 ? (
            <EmptyState icon="🪪" message="No guest passes yet. Pre-authorize a visitor above." />
          ) : (
            visitors.map(v => (
              <Card key={v.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.name}>{v.guestName}</Text>
                  <StatusChip label={String(v.status).toUpperCase()} variant={v.status === 'active' ? 'success' : 'neutral'} />
                </View>
                <Text style={typography.caption}>
                  +91 {v.guestPhone} · {PURPOSE_LABEL[v.visitPurpose] || v.visitPurpose} · {formatDate(v.visitDate)}
                </Text>
                <Text style={styles.code}>QR: {v.qrToken}</Text>
              </Card>
            ))
          )}
        </>
      ) : null}

      {/* AMENITIES */}
      {tab === 'amenities' ? (
        activeCategory ? (
          /* ---- Facility list for the chosen category ---- */
          <>
            <TouchableOpacity style={styles.backRow} onPress={() => setActiveCategory(null)} hitSlop={8}>
              <Text style={styles.backText}>‹ All facilities</Text>
            </TouchableOpacity>
            <Text style={[typography.h3, styles.sectionTitle]}>{activeCategory.icon} {activeCategory.name}</Text>

            {(activeCategory.facilities || []).map(f => (
              <Card key={f.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.name}>{f.icon} {f.name}</Text>
                  <TouchableOpacity style={styles.bookBtn} onPress={() => setBookAmenityItem(f)}>
                    <Text style={styles.bookText}>Book</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.facilityDesc}>{f.description}</Text>
                <Text style={typography.caption}>📍 {f.location}</Text>
                <Text style={typography.caption}>
                  Capacity {f.capacity}{f.deposit > 0 ? ` · Deposit ₹${f.deposit}` : ' · No deposit'}{f.hourlyRate > 0 ? ` · ₹${f.hourlyRate}/hr` : ''}
                </Text>
                {f.features?.length ? (
                  <View style={styles.featureWrap}>
                    {f.features.map(ft => (
                      <View key={ft} style={styles.featureChip}><Text style={styles.featureText}>{ft}</Text></View>
                    ))}
                  </View>
                ) : null}
              </Card>
            ))}
          </>
        ) : (
          /* ---- Category grid ---- */
          <>
            <Text style={[typography.h3, styles.sectionTitle]}>Facilities</Text>
            {amenitiesLoading && amenities.length === 0 ? <CardSkeleton /> : amenities.map(c => (
              <TouchableOpacity key={c.code} activeOpacity={0.7} onPress={() => setActiveCategory(c)}>
                <Card style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.name}>{c.icon} {c.name}</Text>
                    <Text style={styles.chevron}>›</Text>
                  </View>
                  <Text style={typography.caption}>{c.blurb}</Text>
                  <Text style={styles.countMeta}>{c.facilityCount} {c.facilityCount === 1 ? 'facility' : 'facilities'} available</Text>
                </Card>
              </TouchableOpacity>
            ))}

            <Text style={[typography.h3, styles.sectionTitle]}>My bookings</Text>
            {amenityBookings.length === 0 ? <EmptyState icon="🗓️" message="No facility bookings yet." /> : amenityBookings.map(b => (
              <Card key={b.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.name}>{b.icon} {b.amenityName}</Text>
                  <StatusChip label={String(b.status).toUpperCase()} variant="info" />
                </View>
                <Text style={typography.caption}>
                  {formatDate(b.bookingDate)} · {b.timeSlot} · {b.occasion} · {b.guestCount} guests
                </Text>
                <Text style={styles.code}>{b.bookingCode}</Text>
              </Card>
            ))}
          </>
        )
      ) : null}

      <PreAuthGuestSheet visible={guestOpen} onClose={() => setGuestOpen(false)} onDone={() => dispatch(loadVisitors())} />
      <AmenityBookingSheet
        visible={!!bookAmenityItem}
        amenity={bookAmenityItem}
        onClose={() => setBookAmenityItem(null)}
        onBooked={() => { setBookAmenityItem(null); dispatch(loadAmenityBookings()); }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: palette.primary, borderColor: palette.primary, marginBottom: spacing.md },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  heroSub: { color: '#DBE3FF', fontSize: 13, marginTop: 6, lineHeight: 19 },

  tabBar: { flexDirection: 'row', backgroundColor: palette.surfaceAlt, borderRadius: radius.md, padding: 4, marginBottom: spacing.md },
  tab: { flex: 1, paddingVertical: 9, borderRadius: radius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: palette.surface, elevation: 1 },
  tabText: { fontSize: 13, fontWeight: '600', color: palette.textMuted },
  tabTextActive: { color: palette.primary, fontWeight: '700' },

  sectionTitle: { marginBottom: spacing.sm, marginTop: spacing.sm },
  card: { marginBottom: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '700', color: palette.text, flex: 1 },
  meta: { fontSize: 11, color: palette.textMuted, marginTop: 6 },
  code: { fontSize: 11, color: palette.textMuted, marginTop: 4, letterSpacing: 0.4 },
  eventDate: { fontSize: 12, fontWeight: '700', color: palette.primary },
  bookBtn: { paddingHorizontal: spacing.lg, paddingVertical: 7, borderRadius: radius.md, backgroundColor: palette.primary },
  bookText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  chevron: { fontSize: 24, color: palette.textMuted, marginLeft: spacing.sm, fontWeight: '700' },
  countMeta: { fontSize: 12, color: palette.primary, fontWeight: '600', marginTop: 6 },
  backRow: { paddingVertical: 4, marginBottom: 2 },
  backText: { fontSize: 14, fontWeight: '700', color: palette.primary },
  facilityDesc: { fontSize: 13, color: palette.text, marginBottom: 6, lineHeight: 18 },
  featureWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  featureChip: { backgroundColor: palette.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6, marginBottom: 6 },
  featureText: { fontSize: 11, fontWeight: '600', color: palette.textMuted },
});
