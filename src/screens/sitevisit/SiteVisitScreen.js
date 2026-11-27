import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image, FlatList, Dimensions, ScrollView } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import ScreenContainer from '../../components/ScreenContainer';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import { Neu } from '../../components/neu';
import MediaViewer, { thumbOf } from '../../components/MediaViewer';
import { palette, spacing, FONT } from '../../theme';
import { formatDate } from '../../utils/format';
import { siteApi } from '../../api/siteApi';
import { sosApi } from '../../api/sosApi';

// Site Overview — the site page of the project(s) this resident's property is
// linked to: about, photos & videos (tap to open / play), map, progress and
// progress posts. Several properties → switch with the chips on top.
export default function SiteVisitScreen({ route }) {
  const [data, setData] = useState(null);
  const [sos, setSos] = useState({ sosPhone: null, services: [] });
  const [loading, setLoading] = useState(true);
  const [pick, setPick] = useState(route?.params?.projectId ?? null);
  const [viewer, setViewer] = useState(null); // { items, index }
  const [more, setMore] = useState(false);
  const w = Dimensions.get('window').width;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, contacts] = await Promise.all([siteApi.getOverview(), sosApi.getContacts().catch(() => ({}))]);
      setData(ov);
      setSos({ sosPhone: contacts?.sosPhone || null, services: contacts?.services || [] });
    } catch (e) { /* show empty */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (route?.params?.projectId) setPick(route.params.projectId); }, [route?.params?.projectId]);

  const open = url => url && Linking.openURL(url).catch(() => {});
  const call = phone => phone && Linking.openURL(`tel:${phone}`).catch(() => {});

  if (loading && !data) return <ScreenContainer><CardSkeleton /><CardSkeleton /></ScreenContainer>;

  // New API: sites[]; old global overview as a fallback.
  const sites = data?.sites?.length ? data.sites : (data ? [{
    project: { id: 0, name: data.config?.title || 'Site Overview' },
    config: { ...data.config, shortDesc: '', longDesc: '' },
    media: (data.images || []).map(i => ({ type: 'image', url: i.url, caption: i.caption })),
    updates: (data.updates || []).map(u => ({ ...u, media: u.mediaUrl ? [{ type: 'image', url: u.mediaUrl }] : [] })),
  }] : []);
  const site = sites.find(s => String(s.project.id) === String(pick)) || sites[0];
  if (!site) return <ScreenContainer><EmptyState icon="🏗️" message="Your property's site details will appear here." /></ScreenContainer>;
  const cfg = site.config || {};
  const media = site.media || [];
  const pct = Math.max(0, Math.min(100, Number(cfg.progressPercent) || 0));

  return (
    <ScreenContainer refreshing={loading} onRefresh={load}>
      {sites.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {sites.map(s => {
            const on = s.project.id === site.project.id;
            return (
              <TouchableOpacity key={s.project.id} onPress={() => { setPick(s.project.id); setMore(false); }} activeOpacity={0.8}>
                <Neu variant={on ? 'insetSm' : 'raisedSm'} radius={16} style={styles.chip}>
                  <Text style={[styles.chipText, on && { color: palette.primary }]}>{s.project.name}</Text>
                </Neu>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {/* Gallery */}
      {media.length > 0 ? (
        <FlatList
          horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          data={media}
          keyExtractor={(m, i) => `${m.id || i}`}
          style={{ marginHorizontal: -spacing.lg, marginBottom: spacing.md }}
          renderItem={({ item, index }) => (
            <TouchableOpacity activeOpacity={0.9} onPress={() => setViewer({ items: media, index })} style={{ width: w, paddingHorizontal: spacing.lg }}>
              <View>
                {thumbOf(item)
                  ? <Image source={{ uri: thumbOf(item) }} style={styles.hero} resizeMode="cover" />
                  : <View style={[styles.hero, styles.videoPh]}><Feather name="film" size={40} color="#fff" /></View>}
                {item.type === 'video' ? <View style={styles.play}><Feather name="play" size={28} color={palette.navy} /></View> : null}
                <View style={styles.counter}><Text style={styles.counterText}>{index + 1}/{media.length}</Text></View>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : null}

      <Text style={styles.title}>{site.project.name}</Text>
      {cfg.shortDesc ? <Text style={styles.short}>{cfg.shortDesc}</Text> : null}
      {cfg.address ? <View style={styles.addrRow}><Feather name="map-pin" size={14} color={palette.textMuted} /><Text style={styles.addr}>{cfg.address}</Text></View> : null}

      {cfg.mapUrl ? (
        <TouchableOpacity onPress={() => open(cfg.mapUrl)} activeOpacity={0.85}>
          <Neu variant="raisedSm" radius={18} style={styles.mapCard}>
            <Feather name="navigation" size={18} color={palette.primary} />
            <Text style={styles.mapText}>Open site location on Google Maps</Text>
          </Neu>
        </TouchableOpacity>
      ) : null}

      {cfg.longDesc ? (
        <Neu radius={20} style={styles.card}>
          <Text style={styles.section}>About the project</Text>
          <Text style={styles.body} numberOfLines={more ? undefined : 5}>{cfg.longDesc}</Text>
          {cfg.longDesc.length > 220 ? (
            <TouchableOpacity onPress={() => setMore(m => !m)}><Text style={styles.more}>{more ? 'Show less' : 'Read more'}</Text></TouchableOpacity>
          ) : null}
        </Neu>
      ) : null}

      <Neu radius={20} style={styles.card}>
        <Text style={styles.section}>Construction progress</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.pctBig}>{pct}%</Text>
          {cfg.progressNote ? <Text style={[styles.body, { flex: 1, marginLeft: spacing.md }]}>{cfg.progressNote}</Text> : null}
        </View>
        <Neu variant="insetSm" radius={6} style={styles.bar}><View style={[styles.fill, { width: `${pct}%` }]} /></Neu>
      </Neu>

      {site.updates?.length ? (
        <>
          <Text style={styles.h3}>Site updates</Text>
          {site.updates.map(u => (
            <Neu key={u.id} radius={20} style={styles.card}>
              <Text style={styles.updTitle}>{u.title}</Text>
              <Text style={styles.date}>{formatDate(u.postedAt)}</Text>
              {u.description ? <Text style={[styles.body, { marginTop: 6 }]}>{u.description}</Text> : null}
              {u.media?.length ? (
                <View style={styles.grid}>
                  {u.media.slice(0, 6).map((m, i) => (
                    <TouchableOpacity key={i} activeOpacity={0.85} onPress={() => setViewer({ items: u.media, index: i })}
                      style={[styles.cell, u.media.length === 1 && styles.cellFull]}>
                      {thumbOf(m)
                        ? <Image source={{ uri: thumbOf(m) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                        : <View style={[StyleSheet.absoluteFill, styles.videoPh]}><Feather name="film" size={22} color="#fff" /></View>}
                      {m.type === 'video' ? <View style={styles.playSm}><Feather name="play" size={16} color={palette.navy} /></View> : null}
                      {i === 5 && u.media.length > 6 ? <View style={styles.moreCell}><Text style={styles.moreText}>+{u.media.length - 6}</Text></View> : null}
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </Neu>
          ))}
        </>
      ) : null}

      {/* Emergency & SOS */}
      <Text style={styles.h3}>Emergency & SOS</Text>
      {sos.sosPhone ? (
        <TouchableOpacity onPress={() => call(sos.sosPhone)} activeOpacity={0.85}>
          <Neu radius={20} style={[styles.card, styles.rowBetween, { backgroundColor: '#FDECEC' }]}>
            <View><Text style={styles.sosLabel}>SOS Control Room</Text><Text style={styles.sosNum}>{sos.sosPhone}</Text></View>
            <Text style={styles.callBtn}>📞 Call</Text>
          </Neu>
        </TouchableOpacity>
      ) : null}
      {sos.services.map(c => (
        <TouchableOpacity key={c.id} onPress={() => call(c.phone)} activeOpacity={0.85}>
          <Neu radius={18} style={[styles.card, styles.rowBetween]}>
            <View><Text style={styles.updTitle}>{c.name}</Text><Text style={styles.date}>{c.phone}</Text></View>
            <Text style={styles.callBtn}>📞 Call</Text>
          </Neu>
        </TouchableOpacity>
      ))}

      <MediaViewer visible={!!viewer} items={viewer?.items || []} index={viewer?.index || 0} onClose={() => setViewer(null)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  chips: { gap: 10, paddingVertical: 6, paddingHorizontal: 2, marginBottom: spacing.md },
  chip: { paddingHorizontal: 16, paddingVertical: 9 },
  chipText: { fontSize: 13, fontWeight: '700', color: palette.textMuted },
  hero: { width: '100%', height: 210, borderRadius: 20, backgroundColor: palette.surfaceAlt },
  videoPh: { backgroundColor: '#1F2F5C', alignItems: 'center', justifyContent: 'center' },
  play: { position: 'absolute', top: 77, alignSelf: 'center', width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', paddingLeft: 3 },
  counter: { position: 'absolute', right: 10, bottom: 10, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  counterText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  title: { fontFamily: FONT, fontSize: 22, fontWeight: '800', color: palette.navy },
  short: { fontSize: 14, color: palette.text, marginTop: 4, lineHeight: 20 },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  addr: { fontSize: 13, color: palette.textMuted, flex: 1 },
  mapCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, marginTop: spacing.md },
  mapText: { color: palette.primary, fontWeight: '800', fontSize: 14 },
  card: { padding: 16, marginTop: spacing.md },
  section: { fontSize: 15, fontWeight: '800', color: palette.navy, marginBottom: 8 },
  body: { fontSize: 13.5, color: palette.textMuted, lineHeight: 20 },
  more: { color: palette.primary, fontWeight: '800', marginTop: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pctBig: { fontSize: 30, fontWeight: '900', color: palette.primary },
  bar: { height: 12, marginTop: spacing.md, overflow: 'hidden', justifyContent: 'center', paddingHorizontal: 2 },
  fill: { height: 8, borderRadius: 4, backgroundColor: '#16A34A' },
  h3: { fontFamily: FONT, fontSize: 17, fontWeight: '800', color: palette.navy, marginTop: spacing.lg },
  updTitle: { fontSize: 15, fontWeight: '800', color: palette.text },
  date: { fontSize: 12, color: palette.textMuted, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  cell: { width: '32%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: palette.surfaceAlt },
  cellFull: { width: '100%', aspectRatio: 16 / 9 },
  playSm: { position: 'absolute', top: '50%', left: '50%', marginLeft: -16, marginTop: -16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
  moreCell: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  moreText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  sosLabel: { fontSize: 12, color: '#B91C1C', fontWeight: '800' },
  sosNum: { fontSize: 18, fontWeight: '800', color: palette.text, marginTop: 2 },
  callBtn: { color: palette.primary, fontWeight: '800', fontSize: 14 },
});
