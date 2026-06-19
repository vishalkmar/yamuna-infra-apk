import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Linking } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import DateRangeInput from '../../components/DateRangeInput';
import DocumentDetailSheet from '../../components/DocumentDetailSheet';
import { palette, radius, spacing, typography } from '../../theme';
import { formatDate } from '../../utils/format';
import {
  loadDocuments, loadCategories,
  setFilters, resetFilters, setViewMode,
  enterSelection, toggleSelected, clearSelection, selectAll,
  bulkDownload, logDocumentShare,
} from '../../store/slices/documentSlice';
import { initiateEsign } from '../../store/slices/bookingSlice';
import { showToast } from '../../utils/toastConfig';
import { paymentApi } from '../../api/paymentApi';

const CATEGORY_META = {
  all:       { label: 'All',          icon: '📂' },
  agreement: { label: 'Agreements',   icon: '📜' },
  invoice:   { label: 'Invoices',     icon: '🧾' },
  receipt:   { label: 'Receipts',     icon: '💳' },
  noc:       { label: 'NOCs',         icon: '✅' },
  tax:       { label: 'Tax Docs',     icon: '📑' },
};

const STATUS = {
  available:         { variant: 'success', label: 'AVAILABLE' },
  signed:            { variant: 'primary', label: 'SIGNED' },
  pending_signature: { variant: 'warning', label: 'NEEDS SIGN' },
};

export default function DocumentRepositoryScreen({ navigation }) {
  const dispatch = useDispatch();
  const { documents, categories, filters, loading, selectionMode, selected, viewMode, bulkBusy }
    = useSelector(s => s.documents);
  const user = useSelector(s => s.auth.user);
  const token = useSelector(s => s.auth.token);
  const bookingId = user?.bookingId || user?.primary_booking_id || 'BK-2024-00421';

  const [showFilters, setShowFilters] = useState(false);
  const [activeDoc, setActiveDoc] = useState(null);
  const [stmtPropertyId, setStmtPropertyId] = useState(null);

  // Resolve the resident's property so we can offer the payment statement (invoice).
  useEffect(() => {
    paymentApi.myProperties().then(list => { if (list?.length) setStmtPropertyId(list[0].id); }).catch(() => {});
  }, []);

  const downloadStatement = () => {
    if (!stmtPropertyId) { showToast('info', 'No statement', 'No payment plan linked yet.'); return; }
    Linking.openURL(paymentApi.statementUrl(stmtPropertyId, token)).catch(() => showToast('error', 'Cannot open', 'Try again.'));
  };

  const reload = useCallback(() => {
    dispatch(loadDocuments({ bookingId, ...filters }));
  }, [dispatch, bookingId, filters]);

  useEffect(() => {
    dispatch(loadCategories(bookingId));
  }, [dispatch, bookingId]);

  useEffect(() => { reload(); }, [reload]);

  // Header toolbar actions when in selection mode
  useEffect(() => {
    navigation?.setOptions?.({
      headerTitle: selectionMode ? `${selected.length} selected` : 'Documents',
      headerLeft: selectionMode ? () => (
        <TouchableOpacity onPress={() => dispatch(clearSelection())} hitSlop={10}>
          <Text style={styles.headerBtn}>Cancel</Text>
        </TouchableOpacity>
      ) : undefined,
      headerRight: selectionMode ? () => (
        <TouchableOpacity onPress={() => dispatch(selectAll())} hitSlop={10}>
          <Text style={styles.headerBtn}>Select all</Text>
        </TouchableOpacity>
      ) : undefined,
    });
  }, [navigation, selectionMode, selected.length, dispatch]);

  const allCategories = useMemo(() => {
    const known = ['all', ...Object.keys(CATEGORY_META).filter(k => k !== 'all')];
    const present = new Set(['all', ...(categories.buckets || []).map(b => b.category)]);
    return known.filter(k => present.has(k));
  }, [categories]);

  const countFor = cat => {
    if (cat === 'all') return categories.total;
    return categories.buckets.find(b => b.category === cat)?.total || 0;
  };

  const onDocTap = doc => {
    if (selectionMode) {
      dispatch(toggleSelected(doc.id));
    } else {
      setActiveDoc(doc);
    }
  };
  const onDocLongPress = doc => {
    if (!selectionMode) dispatch(enterSelection(doc.id));
  };

  const onBulkDownload = async () => {
    try {
      await dispatch(bulkDownload({ bookingId, ids: selected })).unwrap();
      showToast('success', 'Download started', `${selected.length} document${selected.length > 1 ? 's' : ''} queued for download.`);
    } catch (e) {
      showToast('error', 'Bulk download failed', String(e));
    }
  };
  const onBulkShareWhatsApp = () => {
    dispatch(logDocumentShare({ bookingId, ids: selected, channel: 'whatsapp' }));
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent('Sharing documents from Yamuna Infra')}`)
      .catch(() => showToast('error', 'WhatsApp not installed', 'Install WhatsApp to share via this channel.'));
    showToast('success', 'Shared', `${selected.length} document${selected.length > 1 ? 's' : ''} shared via WhatsApp`);
    dispatch(clearSelection());
  };

  const onSign = async doc => {
    try {
      await dispatch(initiateEsign({ bookingId, docId: doc.id })).unwrap();
      // Use Module-1 BookingDocketScreen for the WebView modal — navigate there
      // with a deeplink hint. For simplicity here just show a toast.
      showToast('info', 'Open Booking Docket', 'Continue signing from the Booking Docket screen.');
      navigation?.navigate?.('BookingDocket');
    } catch (e) {
      showToast('error', 'Could not start signing', String(e));
    }
  };

  // ---- States ----
  if (loading && documents.length === 0) {
    return (
      <ScreenContainer>
        <CardSkeleton />
        <CardSkeleton />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false}>
      <View style={styles.outer}>
        {/* Summary + search */}
        {!selectionMode ? (
          <View style={styles.headerWrap}>
            <View style={styles.topRow}>
              <Text style={typography.h3}>{categories.total} documents</Text>
              <TouchableOpacity onPress={() => dispatch(setViewMode(viewMode === 'grid' ? 'list' : 'grid'))}>
                <Text style={styles.viewSwap}>{viewMode === 'grid' ? '☰  List' : '▦  Grid'}</Text>
              </TouchableOpacity>
            </View>
            {categories.pendingSign > 0 ? (
              <Text style={styles.pendingNote}>
                ⚠  {categories.pendingSign} document{categories.pendingSign > 1 ? 's' : ''} need your signature
              </Text>
            ) : null}

            {/* Payment statement (invoice) — direct download */}
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
              value={filters.search}
              onChangeText={s => dispatch(setFilters({ search: s }))}
              autoCorrect={false}
              style={{ marginBottom: spacing.sm }}
            />

            <FlatList
              horizontal
              data={allCategories}
              keyExtractor={c => c}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: spacing.sm }}
              renderItem={({ item: c }) => {
                const meta = CATEGORY_META[c] || { label: c, icon: '📄' };
                const active = filters.category === c;
                return (
                  <TouchableOpacity
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => dispatch(setFilters({ category: c }))}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {meta.icon}  {meta.label} · {countFor(c)}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity
              style={styles.filterToggle}
              onPress={() => setShowFilters(s => !s)}
              hitSlop={10}
            >
              <Text style={styles.filterToggleText}>
                {showFilters ? '▲  Hide date range' : '▼  Filter by date'}
              </Text>
              {filters.from || filters.to ? (
                <TouchableOpacity onPress={() => dispatch(resetFilters())}>
                  <Text style={styles.clearAll}>Clear</Text>
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
            {showFilters ? (
              <DateRangeInput
                from={filters.from}
                to={filters.to}
                onChange={vals => dispatch(setFilters(vals))}
              />
            ) : null}
          </View>
        ) : null}

        {/* List */}
        {documents.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No documents match"
            message="Adjust the search or filters above."
          />
        ) : viewMode === 'grid' ? (
          <FlatList
            data={documents}
            keyExtractor={d => String(d.id)}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: spacing.sm }}
            renderItem={({ item }) => (
              <GridTile
                doc={item}
                selected={selected.includes(item.id)}
                selectionMode={selectionMode}
                onPress={() => onDocTap(item)}
                onLongPress={() => onDocLongPress(item)}
              />
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            data={documents}
            keyExtractor={d => String(d.id)}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            renderItem={({ item }) => (
              <ListRow
                doc={item}
                selected={selected.includes(item.id)}
                selectionMode={selectionMode}
                onPress={() => onDocTap(item)}
                onLongPress={() => onDocLongPress(item)}
              />
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Selection toolbar */}
        {selectionMode && selected.length > 0 ? (
          <View style={styles.toolbar}>
            <Button
              title={bulkBusy ? 'Downloading…' : `⬇  Download (${selected.length})`}
              onPress={onBulkDownload}
              loading={bulkBusy}
              style={{ flex: 1 }}
              fullWidth={false}
            />
            <View style={{ width: spacing.sm }} />
            <Button
              title="📤  Share"
              variant="outline"
              onPress={onBulkShareWhatsApp}
              style={{ flex: 1 }}
              fullWidth={false}
            />
          </View>
        ) : null}

        <DocumentDetailSheet
          visible={!!activeDoc}
          doc={activeDoc}
          bookingId={bookingId}
          onClose={() => setActiveDoc(null)}
          onSign={onSign}
        />
      </View>
    </ScreenContainer>
  );
}

// =========================================================================
//                            Grid tile / List row
// =========================================================================

function GridTile({ doc, selected, selectionMode, onPress, onLongPress }) {
  const status = STATUS[doc.status] || { variant: 'neutral', label: '' };
  const catMeta = CATEGORY_META[doc.category] || { icon: '📄' };
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.tile, selected && styles.tileSelected]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={250}
    >
      {selectionMode ? (
        <View style={[styles.checkbox, selected && styles.checkboxOn]}>
          {selected ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
      ) : null}
      <Text style={styles.tileIcon}>{catMeta.icon}</Text>
      <Text style={styles.tileName} numberOfLines={2}>{doc.name}</Text>
      <Text style={styles.tileMeta} numberOfLines={1}>
        {formatDate(doc.date)} · {doc.size || '—'}
      </Text>
      {status.label ? (
        <View style={{ marginTop: 6 }}>
          <StatusChip label={status.label} variant={status.variant} />
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function ListRow({ doc, selected, selectionMode, onPress, onLongPress }) {
  const status = STATUS[doc.status] || { variant: 'neutral', label: '' };
  const catMeta = CATEGORY_META[doc.category] || { icon: '📄' };
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={250}
    >
      <Card padded style={[selected && styles.rowSelected]}>
        <View style={styles.rowInner}>
          {selectionMode ? (
            <View style={[styles.checkbox, selected && styles.checkboxOn, { marginRight: spacing.md }]}>
              {selected ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
          ) : (
            <View style={styles.rowIcon}>
              <Text style={{ fontSize: 22 }}>{catMeta.icon}</Text>
            </View>
          )}
          <View style={{ flex: 1, marginLeft: selectionMode ? 0 : spacing.md }}>
            <Text style={styles.rowName} numberOfLines={2}>{doc.name}</Text>
            <Text style={typography.caption}>
              {doc.category} · {formatDate(doc.date)}{doc.size ? ` · ${doc.size}` : ''}
            </Text>
            {status.label ? (
              <View style={{ marginTop: 6 }}>
                <StatusChip label={status.label} variant={status.variant} />
              </View>
            ) : null}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

// =========================================================================
//                                  Styles
// =========================================================================

const styles = StyleSheet.create({
  outer: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },

  headerWrap: { marginBottom: spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  viewSwap: { color: palette.primary, fontWeight: '600', fontSize: 12 },
  pendingNote: { ...typography.caption, color: palette.warning, marginBottom: spacing.sm, fontWeight: '600' },
  invoiceCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', borderWidth: 1,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  invoiceIcon: { fontSize: 22 },
  invoiceTitle: { fontSize: 14, fontWeight: '700', color: palette.text },
  invoiceSub: { ...typography.caption },
  invoiceDl: { color: palette.primary, fontWeight: '800', fontSize: 13 },

  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: palette.border,
    backgroundColor: palette.surface,
    marginRight: 8,
  },
  chipActive: { borderColor: palette.primary, backgroundColor: '#EEF2FF' },
  chipText: { fontSize: 12, color: palette.textMuted, fontWeight: '600' },
  chipTextActive: { color: palette.primary },

  filterToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  filterToggleText: { color: palette.primary, fontWeight: '600', fontSize: 13 },
  clearAll: { color: palette.error, fontSize: 12, fontWeight: '600' },

  // Tile (grid)
  tile: {
    width: '48.5%',
    minHeight: 150,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.divider,
    backgroundColor: palette.surface,
  },
  tileSelected: { borderColor: palette.primary, borderWidth: 2, backgroundColor: '#EEF2FF' },
  tileIcon: { fontSize: 28, marginBottom: 8 },
  tileName: { fontSize: 13, fontWeight: '600', color: palette.text, lineHeight: 18 },
  tileMeta: { ...typography.caption, marginTop: 4 },

  // Row (list)
  rowInner: { flexDirection: 'row', alignItems: 'center' },
  rowIcon: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  rowName: { fontSize: 13, fontWeight: '600', color: palette.text },
  rowSelected: { borderColor: palette.primary, backgroundColor: '#EEF2FF' },

  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: palette.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: palette.surface,
  },
  checkboxOn: { borderColor: palette.primary, backgroundColor: palette.primary },
  checkmark: { color: '#fff', fontWeight: '700', fontSize: 14 },

  toolbar: {
    position: 'absolute',
    left: spacing.lg, right: spacing.lg, bottom: spacing.lg,
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: palette.divider,
    shadowColor: '#0F172A', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  headerBtn: { color: palette.primary, fontWeight: '600', fontSize: 14, paddingHorizontal: spacing.sm },
});
