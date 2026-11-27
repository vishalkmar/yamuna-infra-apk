import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import ScreenContainer from '../../components/ScreenContainer';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import { Neu } from '../../components/neu';
import { ENV } from '../../constants/env';
import { mockApi } from '../../api/mock';
import api from '../../api/client';
import { palette, spacing, FONT } from '../../theme';
import { formatDate } from '../../utils/format';
import { onNewNotification, openLink, refreshUnread, decUnread, clearUnread } from '../../services/liveNotifications';

async function fetchNotifications() {
  if (ENV.USE_MOCK_API) return mockApi.getNotifications();
  const { data } = await api.get('/notifications');
  return data.data;
}

function timeAgo(iso) {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return '';
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

// Category → icon + colour.
const KIND = {
  payment: { icon: 'credit-card', color: '#16794A', bg: '#DCF5E7' },
  document: { icon: 'file-text', color: '#2E4374', bg: '#E3ECFB' },
  construction: { icon: 'tool', color: '#B26A00', bg: '#FDF0DA' },
  site: { icon: 'image', color: '#B26A00', bg: '#FDF0DA' },
  account: { icon: 'home', color: '#6D28D9', bg: '#EDE4FD' },
};
const kindOf = n => {
  if (n.category === 'payment' && /overdue|due|reminder|left/i.test(n.title)) return { icon: 'clock', color: '#C62828', bg: '#FDE4E4' };
  return KIND[n.category] || { icon: 'bell', color: palette.primary, bg: '#E3ECFB' };
};

const FILTERS = [
  ['all', 'All'], ['unread', 'Unread'], ['payment', 'Payments'], ['document', 'Documents'], ['updates', 'Updates'],
];

export default function NotificationsScreen() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  const reload = useCallback(async () => {
    setLoading(true);
    try { setList(await fetchNotifications()); refreshUnread(); } catch (e) { /* keep old */ }
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);
  // New ones arrive live over the socket.
  useEffect(() => onNewNotification(n => setList(prev => (prev.some(p => p.id === n.id) ? prev : [n, ...prev]))), []);

  const markRead = n => {
    if (n.read) return;
    setList(prev => prev.map(x => (x.id === n.id ? { ...x, read: true } : x)));
    decUnread();
    if (typeof n.id === 'number') api.post(`/notifications/${n.id}/read`).catch(() => {});
  };
  const markAllRead = () => {
    setList(prev => prev.map(n => ({ ...n, read: true })));
    clearUnread();
    api.post('/notifications/read-all').catch(() => {});
  };
  const onPress = n => { markRead(n); if (n.link) openLink(n.link); };

  const shown = useMemo(() => list.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'payment') return n.category === 'payment';
    if (filter === 'document') return n.category === 'document' || n.category === 'account';
    if (filter === 'updates') return ['site', 'construction', 'announcement', 'general'].includes(n.category) || !n.category;
    return true;
  }), [list, filter]);
  const unread = list.filter(n => !n.read).length;

  return (
    <ScreenContainer refreshing={loading} onRefresh={reload}>
      <View style={styles.head}>
        <View>
          <Text style={styles.headTitle}>{unread > 0 ? `${unread} unread` : 'All caught up'}</Text>
          <Text style={styles.headSub}>Payments, dues, dockets & site updates</Text>
        </View>
        {unread > 0 ? (
          <TouchableOpacity onPress={markAllRead} activeOpacity={0.8}>
            <Neu variant="raisedSm" radius={14} style={styles.allBtn}>
              <Feather name="check-circle" size={15} color={palette.primary} />
              <Text style={styles.action}>Mark all read</Text>
            </Neu>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {FILTERS.map(([k, label]) => (
          <TouchableOpacity key={k} onPress={() => setFilter(k)} activeOpacity={0.8}>
            <Neu variant={filter === k ? 'insetSm' : 'raisedSm'} radius={16} style={styles.chip}>
              <Text style={[styles.chipText, filter === k && { color: palette.primary }]}>{label}</Text>
            </Neu>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && list.length === 0 ? (
        <><CardSkeleton /><CardSkeleton /></>
      ) : shown.length === 0 ? (
        <EmptyState icon="🔔" message={filter === 'all' ? 'No notifications yet.' : 'Nothing here.'} />
      ) : shown.map(n => {
        const k = kindOf(n);
        return (
          <TouchableOpacity key={n.id} activeOpacity={0.8} onPress={() => onPress(n)}>
            <Neu variant={n.read ? 'raisedSm' : 'raised'} radius={20} style={[styles.card, !n.read && styles.unreadCard]}>
              <View style={[styles.iconWrap, { backgroundColor: k.bg }]}>
                <Feather name={k.icon} size={20} color={k.color} />
              </View>
              <View style={styles.body}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, !n.read && { color: palette.navy }]} numberOfLines={2}>{n.title}</Text>
                  {!n.read ? <View style={styles.dot} /> : null}
                </View>
                {n.body ? <Text style={styles.text}>{n.body}</Text> : null}
                <View style={styles.metaRow}>
                  <Text style={styles.time}>{timeAgo(n.createdAt || n.time)}</Text>
                  {n.link ? <Text style={styles.open}>Open ›</Text> : null}
                </View>
              </View>
            </Neu>
          </TouchableOpacity>
        );
      })}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  headTitle: { fontFamily: FONT, fontSize: 20, fontWeight: '800', color: palette.navy },
  headSub: { fontSize: 12.5, color: palette.textMuted, marginTop: 2 },
  allBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, gap: 6 },
  action: { color: palette.primary, fontWeight: '800', fontSize: 12.5 },
  chips: { paddingVertical: 6, paddingHorizontal: 2, gap: 10, marginBottom: spacing.md },
  chip: { paddingHorizontal: 16, paddingVertical: 9 },
  chipText: { fontSize: 13, fontWeight: '700', color: palette.textMuted },
  card: { flexDirection: 'row', padding: 14, marginBottom: 14 },
  unreadCard: { borderLeftWidth: 3, borderLeftColor: palette.primary },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontSize: 14.5, fontWeight: '800', color: palette.text, flex: 1 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#F28C28', marginLeft: 8, marginTop: 4 },
  text: { fontSize: 13, color: palette.textMuted, marginTop: 3, lineHeight: 18 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  time: { fontSize: 11.5, color: palette.textMuted },
  open: { fontSize: 12, fontWeight: '800', color: palette.primary },
});
