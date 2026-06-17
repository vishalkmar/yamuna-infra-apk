import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import ShiftingBookingSheet from '../../components/ShiftingBookingSheet';
import UtilityRequestSheet from '../../components/UtilityRequestSheet';
import { palette, radius, spacing, typography } from '../../theme';
import { formatDate } from '../../utils/format';
import { showToast } from '../../utils/toastConfig';
import {
  loadShifting, loadUtilities, loadInteriorPartners, requestReferral,
} from '../../store/slices/moveInSlice';

const TABS = [
  { key: 'shifting',  label: 'Shifting' },
  { key: 'utilities', label: 'Utilities' },
  { key: 'interiors', label: 'Interiors' },
];

const UTILITY_LABEL = {
  electricity: '⚡ Electricity', water: '💧 Water', piped_gas: '🔥 Piped Gas', internet: '🌐 Internet',
};
const UTIL_STATUS_VARIANT = { submitted: 'info', in_progress: 'warning', activated: 'success' };

export default function MoveInScreen() {
  const dispatch = useDispatch();
  const {
    shifting, shiftingLoading, utilities, utilitiesLoading,
    partners, partnersLoading, referralBusy,
  } = useSelector(s => s.movein);
  const user = useSelector(s => s.auth.user);
  const toUnit = user?.unitNumber || 'T2-B-1204';

  const [tab, setTab] = useState('shifting');
  const [shiftOpen, setShiftOpen] = useState(false);
  const [utilOpen, setUtilOpen] = useState(false);

  const reload = useCallback(() => {
    dispatch(loadShifting());
    dispatch(loadUtilities());
    dispatch(loadInteriorPartners());
  }, [dispatch]);

  useEffect(() => { reload(); }, [reload]);

  const refer = async partner => {
    try {
      const res = await dispatch(requestReferral({ partnerId: partner.id })).unwrap();
      showToast('info', 'Referral sent', `${res.partnerName} will reach you at ${res.partnerPhone}.`);
    } catch (e) {
      showToast('error', 'Could not refer', String(e));
    }
  };

  const loading = shiftingLoading || utilitiesLoading || partnersLoading;

  return (
    <ScreenContainer refreshing={loading} onRefresh={reload}>
      <Card style={styles.hero}>
        <Text style={styles.heroTitle}>Move-In Assistance</Text>
        <Text style={styles.heroSub}>Shifting, utility activation and trusted interior partners — all in one place.</Text>
      </Card>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[styles.tab, tab === t.key && styles.tabActive]} onPress={() => setTab(t.key)}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SHIFTING */}
      {tab === 'shifting' ? (
        <>
          <Button title="＋ Book Shifting & Relocation" variant="secondary" onPress={() => setShiftOpen(true)} />
          <View style={{ height: spacing.md }} />
          {shiftingLoading && shifting.length === 0 ? (
            <CardSkeleton />
          ) : shifting.length === 0 ? (
            <EmptyState icon="📦" message="No shifting booked yet. Book your packers & movers above." />
          ) : (
            shifting.map(s => (
              <Card key={s.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{formatDate(s.moveDate)}</Text>
                  <StatusChip label={String(s.status).toUpperCase()} variant="success" />
                </View>
                <Text style={typography.caption} numberOfLines={1}>From: {s.fromAddress}</Text>
                <Text style={typography.caption}>To: {s.toUnit} · {s.itemCategories.join(', ')}</Text>
                {s.packingRequired ? <Text style={styles.tagLine}>📦 Packing service included</Text> : null}
                {s.vendorName ? <Text style={styles.vendor}>Vendor: {s.vendorName}</Text> : null}
              </Card>
            ))
          )}
        </>
      ) : null}

      {/* UTILITIES */}
      {tab === 'utilities' ? (
        <>
          <Button title="＋ Activate a Utility" variant="secondary" onPress={() => setUtilOpen(true)} />
          <View style={{ height: spacing.md }} />
          {utilitiesLoading && utilities.length === 0 ? (
            <CardSkeleton />
          ) : utilities.length === 0 ? (
            <EmptyState icon="🔌" message="No utility requests yet. Activate electricity, water, gas or internet." />
          ) : (
            utilities.map(u => (
              <Card key={u.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{UTILITY_LABEL[u.utilityType] || u.utilityType}</Text>
                  <StatusChip label={String(u.status).replace('_', ' ').toUpperCase()} variant={UTIL_STATUS_VARIANT[u.status] || 'neutral'} />
                </View>
                {u.providerName ? <Text style={typography.caption}>Provider: {u.providerName}</Text> : null}
                {u.expectedActivation ? <Text style={typography.caption}>Expected by {formatDate(u.expectedActivation)}</Text> : null}
              </Card>
            ))
          )}
        </>
      ) : null}

      {/* INTERIORS */}
      {tab === 'interiors' ? (
        partnersLoading && partners.length === 0 ? (
          <CardSkeleton />
        ) : partners.length === 0 ? (
          <EmptyState icon="🛋️" message="No interior partners listed yet." />
        ) : (
          partners.map(p => (
            <Card key={p.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{p.name}</Text>
                <Text style={styles.rating}>★ {p.rating}</Text>
              </View>
              <Text style={typography.caption}>{p.specialty}</Text>
              <View style={styles.partnerActions}>
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${p.phone}`)} style={styles.callLink}>
                  <Text style={styles.callLinkText}>📞 {p.phone}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.referBtn} disabled={referralBusy} onPress={() => refer(p)}>
                  <Text style={styles.referText}>Get referral</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )
      ) : null}

      <ShiftingBookingSheet
        visible={shiftOpen}
        toUnit={toUnit}
        onClose={() => setShiftOpen(false)}
        onBooked={() => { setShiftOpen(false); dispatch(loadShifting()); }}
      />
      <UtilityRequestSheet
        visible={utilOpen}
        onClose={() => setUtilOpen(false)}
        onRequested={() => setUtilOpen(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: palette.primary, borderColor: palette.primary, marginBottom: spacing.md },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  heroSub: { color: '#DBE3FF', fontSize: 13, marginTop: 6, lineHeight: 19 },

  tabBar: {
    flexDirection: 'row', backgroundColor: palette.surfaceAlt,
    borderRadius: radius.md, padding: 4, marginBottom: spacing.md,
  },
  tab: { flex: 1, paddingVertical: 9, borderRadius: radius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: palette.surface, ...{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 } },
  tabText: { fontSize: 13, fontWeight: '600', color: palette.textMuted },
  tabTextActive: { color: palette.primary, fontWeight: '700' },

  card: { marginBottom: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: palette.text },
  tagLine: { fontSize: 12, color: palette.primary, marginTop: 6, fontWeight: '600' },
  vendor: { fontSize: 12, color: palette.textMuted, marginTop: 4 },
  rating: { fontSize: 13, fontWeight: '700', color: palette.accent },

  partnerActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  callLink: { paddingVertical: 6 },
  callLinkText: { color: palette.primary, fontWeight: '600', fontSize: 13 },
  referBtn: {
    paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: palette.primary,
  },
  referText: { color: palette.primary, fontWeight: '700', fontSize: 13 },
});
