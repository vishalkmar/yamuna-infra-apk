import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { palette, spacing, FONT } from '../../theme';

// Shared pieces for My Bookings / Transactions.
export const KIND = {
  service: { icon: 'home', color: '#2E4374', bg: '#E3ECFB', label: 'Home service' },
  appointment: { icon: 'activity', color: '#B91C1C', bg: '#FDE4E4', label: 'Doctor' },
  mobility: { icon: 'truck', color: '#0F766E', bg: '#D5F5EF', label: 'Mobility aid' },
  wellness: { icon: 'sun', color: '#7C3AED', bg: '#EDE4FD', label: 'Wellness' },
  food: { icon: 'shopping-bag', color: '#B45309', bg: '#FDF0DA', label: 'Food' },
  meal: { icon: 'coffee', color: '#B45309', bg: '#FDF0DA', label: 'Meal / tiffin' },
  ride: { icon: 'navigation', color: '#1D4ED8', bg: '#DBEAFE', label: 'Ride' },
  darshan: { icon: 'map-pin', color: '#C2410C', bg: '#FFE8D6', label: 'Darshan' },
  amenity: { icon: 'calendar', color: '#15803D', bg: '#DCF5E7', label: 'Amenity' },
  medicine: { icon: 'plus-square', color: '#BE123C', bg: '#FFE4EA', label: 'Medicine' },
  other: { icon: 'file-text', color: '#475569', bg: '#EEF2F7', label: 'Booking' },
};
export const kindOf = k => KIND[k] || KIND.other;

const PAY = {
  paid: ['Paid ✓', '#16794A', '#DCF5E7'],
  created: ['Payment pending', '#B45309', '#FDF0DA'],
  failed: ['Payment failed', '#C62828', '#FDE4E4'],
  cancelled: ['Expired', '#64748B', '#EEF2F7'],
};
export const payPill = status => PAY[status] || PAY.created;

export const inr = n => (n == null ? '—' : '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }));
export function when(d) {
  if (!d) return '—';
  const x = new Date(String(d).replace(' ', 'T'));
  if (isNaN(x)) return String(d).slice(0, 10);
  return x.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
export function whenTime(d) {
  if (!d) return '—';
  const x = new Date(String(d).replace(' ', 'T'));
  if (isNaN(x)) return String(d);
  return x.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
const pretty = s => String(s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
export const statusLabel = pretty;

export function Pill({ label, color, bg }) {
  return <View style={[styles.pill, { backgroundColor: bg }]}><Text style={[styles.pillText, { color }]}>{label}</Text></View>;
}

export function KindIcon({ kind, size = 44 }) {
  const k = kindOf(kind);
  return (
    <View style={[styles.icon, { width: size, height: size, borderRadius: size * 0.32, backgroundColor: k.bg }]}>
      <Feather name={k.icon} size={size * 0.45} color={k.color} />
    </View>
  );
}

export function Rows({ title, rows }) {
  const r = rows.filter(([, v]) => v != null && v !== '' && v !== '—');
  if (!r.length) return null;
  return (
    <View style={styles.block}>
      {title ? <Text style={styles.blockTitle}>{title}</Text> : null}
      {r.map(([k, v], i) => (
        <View key={k} style={[styles.row, i % 2 === 0 && { backgroundColor: '#F6F8FC' }]}>
          <Text style={styles.rowKey}>{k}</Text>
          <Text style={styles.rowVal} selectable>{String(v)}</Text>
        </View>
      ))}
    </View>
  );
}

export function DetailSheet({ visible, onClose, title, children }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle} numberOfLines={2}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}><Feather name="x" size={24} color={palette.textMuted} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pill: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10 },
  pillText: { fontSize: 11.5, fontWeight: '800' },
  icon: { alignItems: 'center', justifyContent: 'center' },
  block: { marginTop: spacing.md, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  blockTitle: { fontSize: 12.5, fontWeight: '800', color: palette.primary, letterSpacing: 0.4, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6, textTransform: 'uppercase' },
  row: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 9, gap: 10 },
  rowKey: { width: '40%', fontSize: 13, color: palette.textMuted },
  rowVal: { flex: 1, fontSize: 13, color: palette.text, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: palette.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: spacing.xl, maxHeight: '88%' },
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  sheetTitle: { flex: 1, fontFamily: FONT, fontSize: 19, fontWeight: '800', color: palette.navy },
});
