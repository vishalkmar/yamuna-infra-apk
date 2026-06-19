import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import { palette, radius, spacing, typography } from '../../theme';
import { formatDate } from '../../utils/format';
import { docApi } from '../../api/docApi';
import { showToast } from '../../utils/toastConfig';

// Booking dockets are uploaded by the office (admin) per resident and shown
// here as downloadable PDFs.
export default function BookingDocketScreen({ navigation }) {
  const [docs, setDocs] = useState([]);
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

  const open = (url, title) => {
    if (!url) return;
    navigation?.navigate?.('PdfViewer', { url, title });
  };

  if (loading && docs.length === 0) {
    return <ScreenContainer><CardSkeleton /><CardSkeleton /></ScreenContainer>;
  }

  return (
    <ScreenContainer refreshing={loading} onRefresh={load}>
      <Text style={styles.intro}>
        Your booking documents shared by the Yamuna Infra office. Tap to view or download.
      </Text>

      {docs.length === 0 ? (
        <EmptyState icon="📂" title="No documents yet" message="Your booking docket will appear here once the office uploads it." />
      ) : docs.map(d => (
        <TouchableOpacity key={d.id} activeOpacity={0.85} onPress={() => open(d.url, d.title)}>
          <Card style={styles.row}>
            <View style={styles.icon}><Text style={{ fontSize: 22 }}>📄</Text></View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.name}>{d.title}</Text>
              <Text style={typography.caption}>{formatDate(d.createdAt)}</Text>
            </View>
            <Text style={styles.download}>⬇ Open</Text>
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
  download: { color: palette.primary, fontWeight: '800', fontSize: 13 },
});
