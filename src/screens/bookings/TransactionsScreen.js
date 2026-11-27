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
import { KindIcon, kindOf, Pill, payPill, inr, whenTime, Rows, DetailSheet } from './bookingUi';

// Transactions — every payment made for a booking in the app: paid, pending
// (checkout not finished) or failed/expired, with all gateway references.
const FILTERS = [['all', 'All'], ['paid', 'Paid ✓'], ['created', 'Pending'], ['failed', 'Failed / expired']];

export default function TransactionsScreen() {
  const token = useSelector(s => s.auth.token);
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await myApi.transactions()); } catch (e) { showToast('error', 'Could not load', 'Please try again.'); setRows(r => r || []); }
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const shown = useMemo(() => (rows || []).filter(t => {
    if (filter === 'failed') return t.status === 'failed' || t.status === 'cancelled';
    return filter === 'all' || t.status === filter;
  }), [rows, filter]);
  const paidTotal = (rows || []).filter(t => t.status === 'paid').reduce((s, t) => s + Number(t.amount || 0), 0);
  const receipt = t => downloadFile(myApi.receiptLink(t.receiptUrl, token), `Receipt ${t.orderId}`);
  const itemsText = t => (t.items?.length ? t.items.map(i => `${i.qty ? `${i.qty}× ` : ''}${i.name}`).join(', ') : t.remarks);

  if (!rows) return <ScreenContainer><CardSkeleton /><CardSkeleton /></ScreenContainer>;

  return (
    <ScreenContainer refreshing={loading} onRefresh={load}>
      <Neu radius={20} style={styles.summary}>
        <View>
          <Text style={styles.sumLabel}>Paid</Text>
          <Text style={styles.sumValue}>{inr(paidTotal)}</Text>
        </View>
        <View style={styles.sumRight}>
          <Text style={styles.sumSmall}>✓ {rows.filter(t => t.status === 'paid').length}</Text>
          <Text style={[styles.sumSmall, { color: '#B45309' }]}>⏳ {rows.filter(t => t.status === 'created').length}</Text>
          <Text style={[styles.sumSmall, { color: '#C62828' }]}>✕ {rows.filter(t => t.status === 'failed' || t.status === 'cancelled').length}</Text>
        </View>
      </Neu>
      <Text style={styles.intro}>Every booking payment — paid, pending or failed.</Text>
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
        <EmptyState icon="💳" message="No transactions yet. Payments for bookings will appear here." />
      ) : shown.map(t => {
        const p = payPill(t.status);
        return (
          <TouchableOpacity key={t.orderId} activeOpacity={0.85} onPress={() => setOpen(t)}>
            <Neu radius={18} style={styles.row}>
              <KindIcon kind={t.kind} size={40} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.title} numberOfLines={1}>{itemsText(t) || kindOf(t.kind).label}</Text>
                <Text style={styles.meta}>{whenTime(t.paidAt || t.createdAt)}</Text>
                <View style={{ marginTop: 6 }}><Pill label={p[0]} color={p[1]} bg={p[2]} /></View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.amount, t.status !== 'paid' && { color: palette.textMuted }]}>{inr(t.amount)}</Text>
                <Text style={styles.more}>Details ›</Text>
              </View>
            </Neu>
          </TouchableOpacity>
        );
      })}

      <DetailSheet visible={!!open} onClose={() => setOpen(null)} title={open ? `${inr(open.amount)} · ${payPill(open.status)[0]}` : ''}>
        {open ? (
          <>
            <Rows title="What you booked" rows={[['For', kindOf(open.kind).label], ['Items', itemsText(open)]]} />
            <Rows title="Transaction details" rows={[
              ['Status', payPill(open.status)[0]], ['Amount', inr(open.amount)], ['Order ID', open.orderId],
              ['Transaction ID', open.cfPaymentId], ['Bank reference (UTR)', open.bankRef], ['Payment mode', open.payMode],
              ['Booked on', whenTime(open.createdAt)], ['Paid on', open.paidAt ? whenTime(open.paidAt) : null],
            ]} />
            {open.receiptUrl ? (
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
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, marginBottom: spacing.md },
  sumLabel: { fontSize: 12, color: palette.textMuted, fontWeight: '700' },
  sumValue: { fontFamily: FONT, fontSize: 24, fontWeight: '900', color: palette.navy, marginTop: 2 },
  sumRight: { alignItems: 'flex-end', gap: 2 },
  sumSmall: { fontSize: 13, fontWeight: '800', color: '#16794A' },
  intro: { fontSize: 13, color: palette.textMuted, marginBottom: spacing.sm },
  chips: { gap: 10, paddingVertical: 6, paddingHorizontal: 2, marginBottom: spacing.md },
  chip: { paddingHorizontal: 14, paddingVertical: 9 },
  chipText: { fontSize: 13, fontWeight: '700', color: palette.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 12 },
  title: { fontSize: 14.5, fontWeight: '800', color: palette.navy },
  meta: { fontSize: 12, color: palette.textMuted, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '900', color: palette.navy },
  more: { fontSize: 12, fontWeight: '800', color: palette.primary, marginTop: 6 },
  receiptBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primary, borderRadius: 16, paddingVertical: 14, marginTop: spacing.lg },
  receiptText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
