import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import { palette, radius, spacing, typography } from '../../theme';
import { formatDate } from '../../utils/format';
import { docApi } from '../../api/docApi';
import { showToast } from '../../utils/toastConfig';
import { downloadFile } from '../../services/downloader';

// Booking dockets are uploaded by the office (admin) per resident and shown
// here. Tapping one saves the PDF straight into the phone's Downloads folder.
export default function BookingDocketScreen() {
  const [docs, setDocs] = useState([]);
  const [busy, setBusy] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDocs(await docApi.list('booking_docket'));
    } catch (e) {
      showToast('error', 'Could not load', 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const download = async d => {
    if (!d.url || busy) return;
    setBusy(d.id);
    try { await downloadFile(d.url, d.title); } finally { setBusy(null); }
  };

  if (loading && docs.length === 0) {
    return <ScreenContainer><CardSkeleton /><CardSkeleton /></ScreenContainer>;
  }

  return (
    <ScreenContainer refreshing={loading} onRefresh={load}>
      <Text style={styles.intro}>
        Your booking documents shared by the Yamuna Infra office. Tap Download to save the PDF to your phone (Downloads › YamunaInfra) and open it in any PDF viewer.
      </Text>

      {docs.length === 0 ? (
        <EmptyState icon="📂" title="No documents yet" message="Your booking docket will appear here once the office uploads it." />
      ) : docs.map(d => (
        <TouchableOpacity key={d.id} activeOpacity={0.85} onPress={() => download(d)} disabled={busy === d.id}>
          <Card style={styles.row}>
            <View style={styles.icon}><Text style={{ fontSize: 22 }}>📄</Text></View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.name}>{d.title}</Text>
              <Text style={typography.caption}>{formatDate(d.createdAt)}</Text>
            </View>
            {busy === d.id
              ? <ActivityIndicator color={palette.primary} />
              : <View style={styles.dlBtn}><Text style={styles.download}>⬇ Download</Text></View>}
          </Card>
        </TouchableOpacity>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: { ...typography.bodyMuted, marginBottom: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  icon: { width: 44, height: 44, borderRadius: 10, backgroundColor: palette.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 14, fontWeight: '700', color: palette.text },
  dlBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: palette.background, boxShadow: '3px 3px 6px rgba(163,177,198,0.6), -3px -3px 6px rgba(255,255,255,0.9)' },
  download: { color: palette.primary, fontWeight: '800', fontSize: 13 },
});
