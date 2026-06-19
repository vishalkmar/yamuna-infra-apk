import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image, FlatList, Dimensions } from 'react-native';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import { palette, radius, spacing, typography } from '../../theme';
import { formatDate } from '../../utils/format';
import { siteApi } from '../../api/siteApi';
import { sosApi } from '../../api/sosApi';

// Site Overview — admin-managed, the same for every resident (images, map,
// emergency contacts, progress + updates). No booking here.
export default function SiteVisitScreen() {
  const [data, setData] = useState(null);
  const [sos, setSos] = useState({ sosPhone: null, services: [] });
  const [loading, setLoading] = useState(true);
  const w = Dimensions.get('window').width - spacing.lg * 2;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, contacts] = await Promise.all([siteApi.getOverview(), sosApi.getContacts().catch(() => ({}))]);
      setData(ov);
      setSos({ sosPhone: contacts?.sosPhone || null, services: contacts?.services || [] });
    } catch (e) { /* show empty */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const open = url => url && Linking.openURL(url).catch(() => {});
  const call = phone => phone && Linking.openURL(`tel:${phone}`).catch(() => {});

  if (loading && !data) {
    return <ScreenContainer><CardSkeleton /><CardSkeleton /></ScreenContainer>;
  }

  const cfg = data?.config || {};
  const images = data?.images || [];
  const updates = data?.updates || [];

  return (
    <ScreenContainer refreshing={loading} onRefresh={load}>
      {/* Images */}
      {images.length > 0 ? (
        <FlatList
          horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          data={images}
          keyExtractor={i => String(i.id)}
          style={{ marginHorizontal: -spacing.lg, marginBottom: spacing.md }}
          renderItem={({ item }) => (
            <View style={{ width: w + spacing.lg * 2, paddingHorizontal: spacing.lg }}>
              <Image source={{ uri: item.url }} style={styles.hero} resizeMode="cover" />
              {item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null}
            </View>
          )}
        />
      ) : null}

      <Text style={styles.title}>{cfg.title || 'Site Overview'}</Text>
      {cfg.address ? <Text style={typography.bodyMuted}>{cfg.address}</Text> : null}

      {/* Map */}
      {cfg.mapUrl ? (
        <TouchableOpacity onPress={() => open(cfg.mapUrl)}>
          <Card style={styles.mapCard}>
            <Text style={styles.mapText}>📍  Open site location on Google Maps</Text>
          </Card>
        </TouchableOpacity>
      ) : null}

      {/* Progress */}
      <Text style={[typography.h3, styles.sectionTitle]}>Construction progress</Text>
      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.pctBig}>{cfg.progressPercent || 0}%</Text>
          {cfg.progressNote ? <Text style={[typography.caption, { flex: 1, marginLeft: spacing.md }]}>{cfg.progressNote}</Text> : null}
        </View>
        <View style={styles.bar}><View style={[styles.fill, { width: `${cfg.progressPercent || 0}%` }]} /></View>
      </Card>

      {/* Updates */}
      {updates.length > 0 ? (
        <>
          <Text style={[typography.h3, styles.sectionTitle]}>Site updates</Text>
          {updates.map(u => (
            <Card key={u.id} style={styles.updCard}>
              {u.mediaUrl ? <Image source={{ uri: u.mediaUrl }} style={styles.updImg} resizeMode="cover" /> : null}
              <Text style={styles.updTitle}>{u.title}</Text>
              {u.description ? <Text style={typography.caption}>{u.description}</Text> : null}
              <Text style={[typography.caption, { marginTop: 4 }]}>{formatDate(u.postedAt)}</Text>
            </Card>
          ))}
        </>
      ) : null}

      {/* Emergency & SOS */}
      <Text style={[typography.h3, styles.sectionTitle]}>Emergency & SOS</Text>
      {sos.sosPhone ? (
        <TouchableOpacity onPress={() => call(sos.sosPhone)}>
          <Card style={styles.sosCard}>
            <View style={styles.rowBetween}>
              <View><Text style={styles.sosLabel}>SOS Control Room</Text><Text style={styles.sosNum}>{sos.sosPhone}</Text></View>
              <Text style={styles.callBtn}>📞 Call</Text>
            </View>
          </Card>
        </TouchableOpacity>
      ) : null}
      {sos.services.map(c => (
        <TouchableOpacity key={c.id} onPress={() => call(c.phone)}>
          <Card style={styles.contactCard}>
            <View style={styles.rowBetween}>
              <View><Text style={styles.contactName}>{c.name}</Text><Text style={typography.caption}>{c.phone}</Text></View>
              <Text style={styles.callBtn}>📞 Call</Text>
            </View>
          </Card>
        </TouchableOpacity>
      ))}
      {!sos.sosPhone && sos.services.length === 0 ? (
        <EmptyState icon="📇" message="Emergency contacts will appear here." />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 190, borderRadius: radius.md, backgroundColor: palette.surfaceAlt },
  caption: { ...typography.caption, marginTop: 6 },
  title: { ...typography.h2, marginTop: spacing.sm },

  mapCard: { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', marginTop: spacing.md },
  mapText: { color: palette.primary, fontWeight: '700', fontSize: 14 },

  sectionTitle: { marginTop: spacing.lg, marginBottom: spacing.sm },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pctBig: { fontSize: 28, fontWeight: '900', color: palette.primary },
  bar: { height: 8, borderRadius: 4, backgroundColor: palette.surfaceAlt, overflow: 'hidden', marginTop: spacing.md },
  fill: { height: '100%', backgroundColor: palette.success || '#16A34A' },

  updCard: { marginBottom: spacing.sm },
  updImg: { width: '100%', height: 160, borderRadius: radius.sm, backgroundColor: palette.surfaceAlt, marginBottom: spacing.sm },
  updTitle: { fontSize: 15, fontWeight: '700', color: palette.text },

  sosCard: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', marginBottom: spacing.sm },
  sosLabel: { ...typography.caption, color: '#B91C1C', fontWeight: '700' },
  sosNum: { fontSize: 18, fontWeight: '800', color: palette.text, marginTop: 2 },
  contactCard: { marginBottom: spacing.sm },
  contactName: { fontSize: 15, fontWeight: '700', color: palette.text },
  callBtn: { color: palette.primary, fontWeight: '800', fontSize: 14 },
});
