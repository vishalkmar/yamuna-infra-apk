import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { Neu } from '../../components/neu';
import EmptyState from '../../components/EmptyState';
import { palette, spacing } from '../../theme';
import { paymentApi } from '../../api/paymentApi';
import { myApi } from '../../api/myApi';
import { downloadFile } from '../../services/downloader';
import { Pill, payPill, inr, whenTime, when, Rows, DetailSheet } from '../bookings/bookingUi';

// Payments ▸ Transactions — every online attempt to pay this property's
// installments (paid / pending / failed / expired). Service-booking payments
// are NOT here; they live in Home ▸ Transactions.
export default function PropertyTransactionsTab({ propertyId, token, refreshKey }) {
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(null);

  const load = useCallback(async () => {
    if (!propertyId) return;
    try { setRows(await paymentApi.getTransactions(propertyId)); } catch (e) { setRows(r => r || []); }
  }, [propertyId]);
  useEffect(() => { setRows(null); load(); }, [load, refreshKey]);

  const receipt = t => downloadFile(myApi.receiptLink(t.receiptUrl, token), `Receipt ${t.label || t.orderId}`);

  if (!rows) return <ActivityIndicator color={palette.primary} style={{ marginTop: spacing.lg }} />;
  if (!rows.length) return <EmptyState icon="💳" message="No online payments for this property yet. Every Pay Now attempt — paid, pending or failed — will show here." />;

  const paid = rows.filter(r => r.status === 'paid');
  return (
    <View>
      <View style={styles.sum}>
        <Text style={styles.sumText}>✓ {paid.length} · {inr(paid.reduce((s, r) => s + r.amount, 0))}</Text>
        <Text style={[styles.sumText, { color: '#B45309' }]}>⏳ {rows.filter(r => r.status === 'created').length}</Text>
        <Text style={[styles.sumText, { color: '#C62828' }]}>✕ {rows.filter(r => r.status === 'failed' || r.status === 'cancelled').length}</Text>
      </View>
      {rows.map(t => {
        const p = payPill(t.status);
        return (
          <TouchableOpacity key={t.orderId} activeOpacity={0.85} onPress={() => setOpen(t)}>
            <Neu radius={18} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>{t.label || 'Installment'}{t.seq ? ` (#${t.seq})` : ''}</Text>
                <Text style={styles.meta}>{whenTime(t.paidAt || t.createdAt)}</Text>
                <View style={{ marginTop: 6 }}><Pill label={p[0]} color={p[1]} bg={p[2]} /></View>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={[styles.amount, t.status !== 'paid' && { color: palette.textMuted }]}>{inr(t.amount)}</Text>
                {t.receiptUrl ? (
                  <TouchableOpacity onPress={() => receipt(t)} hitSlop={6} style={styles.dl}>
                    <Feather name="download" size={16} color={palette.primary} />
                  </TouchableOpacity>
                ) : <Text style={styles.more}>Details ›</Text>}
              </View>
            </Neu>
          </TouchableOpacity>
        );
      })}

      <DetailSheet visible={!!open} onClose={() => setOpen(null)} title={open ? `${inr(open.amount)} · ${payPill(open.status)[0]}` : ''}>
        {open ? (
          <>
            <Rows title="Transaction details" rows={[
              ['Installment', open.label ? `${open.label}${open.seq ? ` (#${open.seq})` : ''}` : null], ['Due on', open.dueDate ? when(open.dueDate) : null],
              ['Status', payPill(open.status)[0]], ['Amount', inr(open.amount)], ['Order ID', open.orderId],
              ['Payment mode', open.status === 'paid' ? (open.method || 'Cashfree') : null],
              ['Booked on', whenTime(open.createdAt)], ['Paid on', open.paidAt ? whenTime(open.paidAt) : null],
            ]} />
            {open.receiptUrl ? (
              <TouchableOpacity onPress={() => receipt(open)} activeOpacity={0.85} style={styles.btn}>
                <Feather name="download" size={18} color="#fff" />
                <Text style={styles.btnText}>Download receipt</Text>
              </TouchableOpacity>
            ) : null}
          </>
        ) : null}
      </DetailSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  sum: { flexDirection: 'row', gap: 14, marginBottom: spacing.sm },
  sumText: { fontSize: 13, fontWeight: '800', color: '#16794A' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 12 },
  title: { fontSize: 14.5, fontWeight: '800', color: palette.navy },
  meta: { fontSize: 12, color: palette.textMuted, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '900', color: palette.navy },
  more: { fontSize: 12, fontWeight: '800', color: palette.primary },
  dl: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#E3ECFB', alignItems: 'center', justifyContent: 'center' },
  btn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primary, borderRadius: 16, paddingVertical: 14, marginTop: spacing.lg },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
