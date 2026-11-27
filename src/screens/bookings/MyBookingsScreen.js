import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Feather from 'react-native-vector-icons/Feather';

import ScreenContainer from '../../components/ScreenContainer';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import { Neu } from '../../components/neu';
import { palette, spacing, FONT } from '../../theme';
import { myApi } from '../../api/myApi';
import { downloadFile } from '../../services/downloader';
import { showToast } from '../../utils/toastConfig';
import { KindIcon, kindOf, Pill, payPill, inr, when, whenTime, statusLabel, Rows, DetailSheet } from './bookingUi';

// My Bookings — every service the resident booked (cleaning, cook, food,
// doctor, wellness, mobility, rides, darshan…) with payment status and the
// receipt, downloadable straight to the phone.
const FILTERS = [['all', 'All'], ['paid', 'Paid ✓'], ['pending', 'Payment pending'], ['unpaid', 'Not paid online']];

export default function MyBookingsScreen() {
  const token = useSelector(s => s.auth.token);
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await myApi.bookings()); } catch (e) { showToast('error', 'Could not load', 'Please try again.'); setRows(r => r || []); }
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const shown = useMemo(() => (rows || []).filter(b => {
    if (filter === 'paid') return b.payment?.status === 'paid';
    if (filter === 'pending') return b.payment && b.payment.status !== 'paid';
    if (filter === 'unpaid') return !b.payment;
    return true;
  }), [rows, filter]);

  const receipt = b => downloadFile(myApi.receiptLink(b.payment.receiptUrl, token), `Receipt ${b.payment.orderId}`);

  if (!rows) return <ScreenContainer><CardSkeleton /><CardSkeleton /><CardSkeleton /></ScreenContainer>;

  return (
    <ScreenContainer refreshing={loading} onRefresh={load}>
      <Text style={styles.intro}>Every service you booked — with payment status and receipt.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {FILTERS.map(([k, label]) => (
          <TouchableOpacity key={k} onPress={() => setFilter(k)} activeOpacity={0.8}>
            <Neu variant={filter === k ? 'insetSm' : 'raisedSm'} radius={16} style={styles.chip}>
              <Text style={[styles.chipText, filter === k && { color: palette.primary }]}>{label}</Text>
            </Neu>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {shown.length === 0 ? (
        <EmptyState icon="🧾" message="No bookings yet. Services you book (cleaning, food, doctor, rides…) will appear here." />
      ) : shown.map(b => {
        const pay = b.payment ? payPill(b.payment.status) : null;
        return (
          <Neu key={b.key} radius={20} style={styles.card}>
            <View style={styles.top}>
              <KindIcon kind={b.kind} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.title} numberOfLines={2}>{b.title}</Text>
                {b.subtitle ? <Text style={styles.sub} numberOfLines={2}>{b.subtitle}</Text> : null}
                <Text style={styles.meta}>
                  {kindOf(b.kind).label} · {when(b.date || b.createdAt)}{b.slot ? ` · ${b.slot}` : ''}
                </Text>
              </View>
              {b.amount != null ? <Text style={styles.amount}>{inr(b.amount)}</Text> : null}
            </View>
            <View style={styles.bottom}>
              <View style={styles.pills}>
                <Pill label={statusLabel(b.status)} color={palette.navy} bg="#EEF2FA" />
                {pay ? <Pill label={pay[0]} color={pay[1]} bg={pay[2]} /> : null}
              </View>
              <View style={styles.actions}>
                {b.payment?.receiptUrl ? (
                  <TouchableOpacity onPress={() => receipt(b)} hitSlop={6} style={styles.iconBtn}>
                    <Feather name="download" size={17} color={palette.primary} />
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity onPress={() => setOpen(b)} activeOpacity={0.8} style={styles.detailsBtn}>
                  <Text style={styles.detailsText}>Details ›</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Neu>
        );
      })}

      <DetailSheet visible={!!open} onClose={() => setOpen(null)} title={open?.title || ''}>
        {open ? (
          <>
            <Rows title="What you booked" rows={[
              ['Booking', open.title], ['Details', open.subtitle], ...open.details,
            ]} />
            <Rows title="Booking" rows={[
              ['Booking code', open.code], ['Date', when(open.date)], ['Time slot', open.slot],
              ['Status', statusLabel(open.status)], ['Booked on', whenTime(open.createdAt)], ['Amount', open.amount != null ? inr(open.amount) : null],
            ]} />
            {open.payment ? (
              <Rows title="Payment status" rows={[
                ['Status', payPill(open.payment.status)[0]], ['Amount', inr(open.payment.amount)], ['Order ID', open.payment.orderId],
                ['Transaction ID', open.payment.cfPaymentId], ['Bank reference (UTR)', open.payment.bankRef], ['Payment mode', open.payment.mode],
                ['Paid on', open.payment.paidAt ? whenTime(open.payment.paidAt) : null],
              ]} />
            ) : <Rows title="Payment status" rows={[['Status', 'Not paid online']]} />}
            {open.payment?.receiptUrl ? (
              <TouchableOpacity onPress={() => receipt(open)} activeOpacity={0.85} style={styles.receiptBtn}>
                <Feather name="download" size={18} color="#fff" />
                <Text style={styles.receiptText}>Download receipt</Text>
              </TouchableOpacity>
            ) : null}
          </>
        ) : null}
      </DetailSheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 13, color: palette.textMuted, marginBottom: spacing.sm },
  chips: { gap: 10, paddingVertical: 6, paddingHorizontal: 2, marginBottom: spacing.md },
  chip: { paddingHorizontal: 14, paddingVertical: 9 },
  chipText: { fontSize: 13, fontWeight: '700', color: palette.textMuted },
  card: { padding: 14, marginBottom: 14 },
  top: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { fontFamily: FONT, fontSize: 15, fontWeight: '800', color: palette.navy },
  sub: { fontSize: 12.5, color: palette.text, marginTop: 2 },
  meta: { fontSize: 12, color: palette.textMuted, marginTop: 4 },
  amount: { fontSize: 15, fontWeight: '900', color: palette.navy, marginLeft: 8 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E3ECFB' },
  detailsBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, backgroundColor: palette.primary },
  detailsText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  receiptBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primary, borderRadius: 16, paddingVertical: 14, marginTop: spacing.lg },
  receiptText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
