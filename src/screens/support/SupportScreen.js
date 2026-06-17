import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import RaiseTicketSheet from '../../components/RaiseTicketSheet';
import { palette, radius, spacing, typography } from '../../theme';
import { formatDate } from '../../utils/format';
import { loadTickets } from '../../store/slices/supportSlice';

const FILTERS = [
  { key: null,          label: 'All' },
  { key: 'open',        label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved',    label: 'Resolved' },
  { key: 'closed',      label: 'Closed' },
];

const STATUS_VARIANT = {
  open: 'info',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'neutral',
};

const CATEGORY_LABEL = {
  payment: 'Payment', construction: 'Construction', document: 'Document', general: 'General',
};

export default function SupportScreen({ navigation }) {
  const dispatch = useDispatch();
  const { tickets, ticketsLoading } = useSelector(s => s.support);
  const [filter, setFilter] = useState(null);
  const [raiseOpen, setRaiseOpen] = useState(false);

  const reload = useCallback(() => {
    dispatch(loadTickets({ status: filter || undefined }));
  }, [dispatch, filter]);

  useEffect(() => { reload(); }, [reload]);

  // Refresh when returning from the detail screen (status may have changed).
  useEffect(() => navigation.addListener('focus', reload), [navigation, reload]);

  return (
    <ScreenContainer refreshing={ticketsLoading} onRefresh={reload}>
      <Card style={styles.hero}>
        <Text style={styles.heroTitle}>Support & Service Desk</Text>
        <Text style={styles.heroSub}>
          Raise a ticket and chat with our team. Typical response within 24 hours.
        </Text>
        <Button
          title="＋ Raise a Ticket"
          variant="secondary"
          onPress={() => setRaiseOpen(true)}
          style={{ marginTop: spacing.md }}
        />
      </Card>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {FILTERS.map(f => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.label}
              onPress={() => setFilter(f.key)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tickets */}
      {ticketsLoading && tickets.length === 0 ? (
        <>
          <CardSkeleton />
          <CardSkeleton />
        </>
      ) : tickets.length === 0 ? (
        <EmptyState icon="🎫" title="No tickets here" message="Raise a ticket and it will show up here." />
      ) : (
        tickets.map(t => (
          <TouchableOpacity
            key={t.id}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('TicketDetail', { ticketId: t.id, ticketCode: t.ticketCode })}
          >
            <Card style={styles.ticketCard}>
              <View style={styles.ticketTop}>
                <Text style={styles.code}>{t.ticketCode}</Text>
                <StatusChip
                  label={String(t.status).replace('_', ' ').toUpperCase()}
                  variant={STATUS_VARIANT[t.status] || 'neutral'}
                />
              </View>
              <Text style={styles.subject} numberOfLines={1}>{t.subject}</Text>
              {t.lastMessage ? (
                <Text style={typography.caption} numberOfLines={1}>{t.lastMessage}</Text>
              ) : null}
              <View style={styles.metaRow}>
                <Text style={styles.meta}>
                  {CATEGORY_LABEL[t.category] || t.category}
                  {t.priority === 'urgent' ? '  ·  ⚡ Urgent' : ''}
                </Text>
                <Text style={styles.meta}>{formatDate(t.lastMessageAt || t.createdAt)}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}

      <RaiseTicketSheet
        visible={raiseOpen}
        onClose={() => setRaiseOpen(false)}
        onCreated={result => {
          setRaiseOpen(false);
          reload();
          if (result?.id) navigation.navigate('TicketDetail', { ticketId: result.id, ticketCode: result.ticketCode });
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: palette.primary, borderColor: palette.primary, marginBottom: spacing.md },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  heroSub: { color: '#DBE3FF', fontSize: 13, marginTop: 6, lineHeight: 19 },

  chipRow: { paddingVertical: spacing.xs, gap: spacing.sm, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: palette.border,
    backgroundColor: palette.surface,
    marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: palette.textMuted },
  chipTextActive: { color: '#fff' },

  ticketCard: { marginBottom: spacing.sm },
  ticketTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  code: { fontSize: 12, fontWeight: '700', color: palette.textMuted, letterSpacing: 0.4 },
  subject: { fontSize: 15, fontWeight: '700', color: palette.text, marginBottom: 2 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  meta: { fontSize: 11, color: palette.textMuted },
});
