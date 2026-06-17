import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image, Linking } from 'react-native';
import { useSelector } from 'react-redux';
import StatusChip from './StatusChip';
import Button from './Button';
import { CardSkeleton } from './Skeleton';
import { palette, radius, spacing, typography } from '../theme';
import { formatDate } from '../utils/format';
import { showToast } from '../utils/toastConfig';

const CROWD = {
  low: { label: 'LOW CROWD', variant: 'success' },
  moderate: { label: 'MODERATE', variant: 'info' },
  high: { label: 'HIGH CROWD', variant: 'warning' },
  very_high: { label: 'VERY HIGH', variant: 'error' },
};

export default function TempleDetailSheet({ visible, onClose, onBookDarshan }) {
  const { active, activeLoading } = useSelector(s => s.temple);

  const open = (url, label) => {
    if (!url) return;
    Linking.openURL(url).catch(() => showToast('error', "Can't open", label));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={typography.h2}>Temple</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}><Text style={styles.close}>×</Text></TouchableOpacity>
          </View>

          {activeLoading || !active ? (
            <CardSkeleton />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {active.imageUrl ? <Image source={{ uri: active.imageUrl }} style={styles.image} resizeMode="cover" /> : null}
              <View style={styles.titleRow}>
                <Text style={styles.name}>{active.name}</Text>
                <StatusChip label={(CROWD[active.crowdStatus] || CROWD.moderate).label} variant={(CROWD[active.crowdStatus] || CROWD.moderate).variant} />
              </View>
              <Text style={typography.caption}>★ {active.rating} · {active.distanceKm} km from project</Text>
              {active.description ? <Text style={styles.desc}>{active.description}</Text> : null}

              <Text style={styles.label}>🪔 Aarti & timings</Text>
              <Text style={styles.body}>{active.aartiTimes || 'Timings unavailable'}</Text>

              {active.festivals?.length ? (
                <>
                  <Text style={styles.label}>📅 Upcoming festivals</Text>
                  {active.festivals.slice(0, 5).map(f => (
                    <View key={f.id} style={styles.festRow}>
                      <Text style={styles.festName}>{f.name}</Text>
                      <Text style={typography.caption}>{formatDate(f.festivalDate)}</Text>
                    </View>
                  ))}
                </>
              ) : null}

              <View style={styles.linkRow}>
                <TouchableOpacity style={styles.linkBtn} onPress={() => open(active.mapsUrl, 'Maps')}>
                  <Text style={styles.linkText}>🗺️ Navigate</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.linkBtn} onPress={() => open(active.donationUrl, 'Donation')}>
                  <Text style={styles.linkText}>🙏 Donate</Text>
                </TouchableOpacity>
              </View>

              <Button
                title={active.vipAvailable ? 'Book Darshan / VIP' : 'Book Darshan & Transport'}
                onPress={() => { onClose(); onBookDarshan?.(active); }}
                style={{ marginTop: spacing.md }}
              />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: palette.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: spacing.xxl, maxHeight: '92%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  close: { fontSize: 26, color: palette.textMuted },
  image: { width: '100%', height: 170, borderRadius: radius.lg, backgroundColor: palette.surfaceAlt, marginBottom: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 18, fontWeight: '800', color: palette.text, flex: 1 },
  desc: { ...typography.body, marginTop: spacing.sm },
  label: { ...typography.label, color: palette.primary, marginTop: spacing.md, marginBottom: 4 },
  body: { ...typography.body },
  festRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: palette.divider },
  festName: { fontSize: 14, fontWeight: '600', color: palette.text },
  linkRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  linkBtn: { flex: 1, paddingVertical: 11, borderRadius: radius.md, borderWidth: 1.5, borderColor: palette.primary, alignItems: 'center', marginRight: spacing.sm },
  linkText: { color: palette.primary, fontWeight: '700', fontSize: 13 },
});
