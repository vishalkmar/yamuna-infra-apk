import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import { ENV } from '../../constants/env';
import { mockApi } from '../../api/mock';
import api from '../../api/client';
import { palette, spacing, typography } from '../../theme';
import { formatDate } from '../../utils/format';

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
  return formatDate(iso);
}

export default function NotificationsScreen() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try { setList(await fetchNotifications()); } catch (e) { /* keep old */ }
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const markRead = id => setList(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  const markAllRead = () => setList(prev => prev.map(n => ({ ...n, read: true })));

  const unread = list.filter(n => !n.read).length;

  return (
    <ScreenContainer refreshing={loading} onRefresh={reload}>
      <View style={styles.head}>
        <Text style={typography.h3}>{unread > 0 ? `${unread} unread` : 'All caught up 🎉'}</Text>
        {unread > 0 ? (
          <TouchableOpacity onPress={markAllRead}><Text style={styles.action}>Mark all read</Text></TouchableOpacity>
        ) : null}
      </View>

      {loading && list.length === 0 ? (
        <><CardSkeleton /><CardSkeleton /></>
      ) : list.length === 0 ? (
        <EmptyState icon="🔔" message="No notifications yet." />
      ) : list.map(n => (
        <TouchableOpacity key={n.id} activeOpacity={0.7} onPress={() => markRead(n.id)}>
          <Card style={[styles.card, !n.read && styles.unreadCard]}>
            <View style={styles.row}>
              <Text style={styles.icon}>{n.icon || '🔔'}</Text>
              <View style={styles.body}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{n.title}</Text>
                  {!n.read ? <View style={styles.dot} /> : null}
                </View>
                <Text style={styles.text}>{n.body}</Text>
                <Text style={styles.time}>{timeAgo(n.time)}</Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  action: { color: palette.primary, fontWeight: '700', fontSize: 13 },
  card: { marginBottom: spacing.sm },
  unreadCard: { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
  row: { flexDirection: 'row' },
  icon: { fontSize: 22, marginRight: spacing.md },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 14, fontWeight: '700', color: palette.text, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.primary, marginLeft: spacing.sm },
  text: { fontSize: 13, color: palette.textMuted, marginTop: 2, lineHeight: 18 },
  time: { fontSize: 11, color: palette.textMuted, marginTop: 6 },
});
