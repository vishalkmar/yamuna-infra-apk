import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Linking } from 'react-native';
import { useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import Input from '../../components/Input';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import { palette, radius, spacing, typography, FONT } from '../../theme';
import { formatDate } from '../../utils/format';
import { docApi } from '../../api/docApi';
import { paymentApi } from '../../api/paymentApi';
import { showToast } from '../../utils/toastConfig';

// Friendly label + icon per document "kind" stored on the backend.
const KIND_META = {
  booking_docket: { label: 'Booking Dockets', icon: '📘' },
  invoice:        { label: 'Invoices',        icon: '🧾' },
  receipt:        { label: 'Receipts',        icon: '💳' },
  agreement:      { label: 'Agreements',      icon: '📜' },
  noc:            { label: 'NOCs',            icon: '✅' },
  tax:            { label: 'Tax Docs',        icon: '📑' },
};
const metaFor = k => KIND_META[k] || { label: k ? k.replace(/_/g, ' ') : 'Documents', icon: '📄' };

// Resident document repository. Lists every document the office has shared with
// the resident (booking dockets, invoices, …) from /documents, plus a direct
// download for the live payment statement.
export default function DocumentRepositoryScreen({ navigation }) {
  const token = useSelector(s => s.auth.token);

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeKind, setActiveKind] = useState('all');
  const [stmtPropertyId, setStmtPropertyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDocs(await docApi.list()); // all kinds
    } catch (e) {
      showToast('error', 'Could not load', 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Resolve the resident's property so we can offer the payment statement.
  useEffect(() => {
    paymentApi.myProperties().then(list => { if (list?.length) setStmtPropertyId(list[0].id); }).catch(() => {});
  }, []);

  const downloadStatement = () => {
    if (!stmtPropertyId) { showToast('info', 'No statement', 'No payment plan linked yet.'); return; }
    Linking.openURL(paymentApi.statementUrl(stmtPropertyId, token))
      .catch(() => showToast('error', 'Cannot open', 'Try again.'));
  };

  const openDoc = doc => {
    if (!doc?.url) { showToast('error', 'Cannot open', 'Invalid file link.'); return; }
    navigation?.navigate?.('PdfViewer', { url: doc.url, title: doc.title });
  };

  // Kind filter chips, derived from what the resident actually has.
  const kinds = useMemo(() => {
    const present = [...new Set(docs.map(d => d.kind).filter(Boolean))];
    return ['all', ...present];
  }, [docs]);

  const filtered = useMemo(() => {
    return docs
      .filter(d => activeKind === 'all' || d.kind === activeKind)
      .filter(d => !search || (d.title || '').toLowerCase().includes(search.toLowerCase()));
  }, [docs, activeKind, search]);

  if (loading && docs.length === 0) {
    return <ScreenContainer><CardSkeleton /><CardSkeleton /></ScreenContainer>;
  }

  return (
    <ScreenContainer scroll={false}>
      <View style={styles.outer}>
        <FlatList
          data={filtered}
          keyExtractor={d => String(d.id)}
          refreshing={loading}
          onRefresh={load}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              <Text style={styles.count}>{docs.length} document{docs.length === 1 ? '' : 's'}</Text>
              <Text style={styles.intro}>
                Documents shared by the Yamuna Infra office. Tap any document to view or download.
              </Text>

              {/* Payment statement — direct download */}
              <TouchableOpacity onPress={downloadStatement} style={styles.invoiceCard} activeOpacity={0.85}>
                <Text style={styles.invoiceIcon}>🧾</Text>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.invoiceTitle}>Payment Statement / Invoice</Text>
                  <Text style={styles.invoiceSub}>Tap to download the latest PDF</Text>
                </View>
                <Text style={styles.invoiceDl}>⬇ PDF</Text>
              </TouchableOpacity>

              <Input
                placeholder="Search by name…"
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
                style={{ marginBottom: spacing.sm }}
              />

              {kinds.length > 1 ? (
                <FlatList
                  horizontal
                  data={kinds}
                  keyExtractor={k => k}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: spacing.sm }}
                  renderItem={({ item: k }) => {
                    const active = activeKind === k;
                    const label = k === 'all' ? 'All' : metaFor(k).label;
                    return (
                      <TouchableOpacity
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setActiveKind(k)}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="📂"
              title="No documents yet"
              message="Documents shared by the office will appear here."
            />
          }
          renderItem={({ item }) => {
            const meta = metaFor(item.kind);
            return (
              <TouchableOpacity activeOpacity={0.85} onPress={() => openDoc(item)}>
                <Card style={styles.row}>
                  <View style={styles.icon}><Text style={{ fontSize: 22 }}>{meta.icon}</Text></View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.name} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.meta}>{meta.label} · {formatDate(item.createdAt)}</Text>
                  </View>
                  <Text style={styles.open}>⬇ Open</Text>
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },

  count: { ...typography.h2, marginBottom: 4 },
  intro: { ...typography.bodyMuted, marginBottom: spacing.md },

  invoiceCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', borderWidth: 1,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  invoiceIcon: { fontSize: 22 },
  invoiceTitle: { fontFamily: FONT, fontSize: 14, fontWeight: '700', color: palette.text },
  invoiceSub: { ...typography.caption },
  invoiceDl: { fontFamily: FONT, color: palette.primary, fontWeight: '800', fontSize: 13 },

  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: palette.border,
    backgroundColor: palette.surface,
    marginRight: 8,
  },
  chipActive: { borderColor: palette.primary, backgroundColor: '#EEF2FF' },
  chipText: { fontFamily: FONT, fontSize: 12, color: palette.textMuted, fontWeight: '600' },
  chipTextActive: { color: palette.primary },

  row: { flexDirection: 'row', alignItems: 'center' },
  icon: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontFamily: FONT, fontSize: 14, fontWeight: '700', color: palette.text },
  meta: { fontFamily: FONT, fontSize: 12, color: palette.textMuted, marginTop: 2 },
  open: { fontFamily: FONT, color: palette.primary, fontWeight: '800', fontSize: 13 },
});
