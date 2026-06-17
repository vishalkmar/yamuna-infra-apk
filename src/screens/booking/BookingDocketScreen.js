import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, FlatList, Image, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { WebView } from 'react-native-webview';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import { palette, radius, spacing, typography } from '../../theme';
import { formatINR, formatDate } from '../../utils/format';
import {
  loadBooking,
  loadWelcomeKit,
  initiateEsign,
  completeEsign,
  resetEsign,
} from '../../store/slices/bookingSlice';
import { showToast } from '../../utils/toastConfig';

const TABS = [
  { key: 'details', label: 'Details' },
  { key: 'documents', label: 'Documents' },
  { key: 'welcome', label: 'Welcome Kit' },
  { key: 'rm', label: 'RM Contact' },
];

export default function BookingDocketScreen() {
  const dispatch = useDispatch();
  const { details, documents, welcomeKit, welcomeKitLoading, loading, error, esign } = useSelector(s => s.booking);
  const user = useSelector(s => s.auth.user);
  const [tab, setTab] = useState('details');
  const [esignDoc, setEsignDoc] = useState(null);

  const bookingId = user?.bookingId || user?.primary_booking_id || 'BK-2024-00421';

  const load = useCallback(() => {
    dispatch(loadBooking(bookingId));
  }, [dispatch, bookingId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (tab === 'welcome' && !welcomeKit && !welcomeKitLoading) {
      dispatch(loadWelcomeKit(bookingId));
    }
  }, [tab, welcomeKit, welcomeKitLoading, dispatch, bookingId]);

  const onStartEsign = async doc => {
    setEsignDoc(doc);
    dispatch(resetEsign());
    try {
      await dispatch(initiateEsign({ bookingId, docId: doc.id })).unwrap();
    } catch (e) {
      showToast('error', 'Could not start signing', String(e));
      setEsignDoc(null);
    }
  };

  const onCompleteSign = async () => {
    try {
      await dispatch(
        completeEsign({
          bookingId,
          docId: esignDoc.id,
          envelopeId: esign.envelopeId,
          status: 'signed',
          notes: 'Signed from mobile app',
        }),
      ).unwrap();
      showToast('success', 'Signed!', `${esignDoc.name} signed successfully. Copy sent to your email.`);
      setEsignDoc(null);
      dispatch(resetEsign());
    } catch (e) {
      showToast('error', 'Sign failed', String(e));
    }
  };

  // ---- Loading screen ----
  if (loading && !details) {
    return (
      <ScreenContainer>
        <CardSkeleton />
        <CardSkeleton />
      </ScreenContainer>
    );
  }

  // ---- Error screen ----
  if (error && !details) {
    return (
      <ScreenContainer>
        <EmptyState
          icon="⚠️"
          title="Couldn't load booking"
          message={error}
        >
          <Button title="Retry" onPress={load} style={{ marginTop: spacing.md }} fullWidth={false} />
        </EmptyState>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer refreshing={loading} onRefresh={load}>
      {/* Summary card */}
      <Card style={styles.summary}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.muted}>BOOKING ID</Text>
            <Text style={styles.bookingId}>{details?.bookingId || '—'}</Text>
          </View>
          <StatusChip
            label={(details?.status || 'active').toUpperCase()}
            variant={details?.status === 'active' ? 'success' : 'neutral'}
          />
        </View>
        <View style={styles.unitRow}>
          <SummaryStat label="Unit" value={details?.unitNumber} />
          <SummaryStat label="Tower" value={details?.tower} />
          <SummaryStat label="Floor" value={details?.floor} />
          <SummaryStat label="Area" value={details?.area ? `${details.area} sq ft` : null} />
        </View>
      </Card>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tab, tab === t.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'details' && <DetailsTab details={details} documents={documents} onStartEsign={onStartEsign} />}
      {tab === 'documents' && <DocumentsTab documents={documents} bookingId={bookingId} onStartEsign={onStartEsign} />}
      {tab === 'welcome' && <WelcomeKitTab kit={welcomeKit} loading={welcomeKitLoading} />}
      {tab === 'rm' && <RMTab details={details} />}

      <EsignModal
        doc={esignDoc}
        esign={esign}
        onClose={() => { setEsignDoc(null); dispatch(resetEsign()); }}
        onComplete={onCompleteSign}
      />
    </ScreenContainer>
  );
}

// =========================================================================
//                              Sub-components
// =========================================================================

function SummaryStat({ label, value }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.muted}>{label.toUpperCase()}</Text>
      <Text style={styles.statValue}>{value || '—'}</Text>
    </View>
  );
}

function DetailsTab({ details, documents, onStartEsign }) {
  if (!details) return null;
  const rows = [
    { label: 'Project', value: details.projectName },
    { label: 'Allottee(s)', value: details.allotteeNames },
    { label: 'Booking Date', value: formatDate(details.bookingDate) },
    { label: 'Agreement Value', value: formatINR(details.agreementValue) },
  ];

  // Find docs that need signing
  const pendingSign = (documents || []).filter(d => d.requiresSignature && !d.signedAt);

  return (
    <Card>
      {rows.map((r, i) => (
        <View key={r.label} style={[styles.kvRow, i === rows.length - 1 && { borderBottomWidth: 0 }]}>
          <Text style={styles.kvLabel}>{r.label}</Text>
          <Text style={styles.kvValue}>{r.value}</Text>
        </View>
      ))}
      {pendingSign.length > 0 ? (
        <View style={styles.pendingBanner}>
          <Text style={styles.pendingTitle}>📝  {pendingSign.length} document{pendingSign.length > 1 ? 's' : ''} need your signature</Text>
          {pendingSign.map(d => (
            <TouchableOpacity key={d.id} style={styles.pendingItem} onPress={() => onStartEsign(d)}>
              <Text style={styles.pendingDocName}>{d.name}</Text>
              <Text style={styles.pendingCta}>Sign now →</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

function DocumentsTab({ documents, bookingId, onStartEsign }) {
  const [filter, setFilter] = useState('all');
  const categories = ['all', 'agreement', 'receipt', 'noc', 'tax'];

  if (!documents?.length) {
    return (
      <EmptyState
        icon="📂"
        title="No documents yet"
        message="Your booking documents will appear here as they're generated."
      />
    );
  }

  const filtered = filter === 'all' ? documents : documents.filter(d => d.category === filter);

  return (
    <>
      <FlatList
        horizontal
        data={categories}
        keyExtractor={c => c}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.sm }}
        renderItem={({ item: c }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === c && styles.filterChipActive]}
            onPress={() => setFilter(c)}
          >
            <Text style={[styles.filterChipText, filter === c && styles.filterChipTextActive]}>
              {c[0].toUpperCase() + c.slice(1)}
            </Text>
          </TouchableOpacity>
        )}
      />
      <FlatList
        data={filtered}
        keyExtractor={i => String(i.id)}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <DocumentRow item={item} bookingId={bookingId} onStartEsign={onStartEsign} />
        )}
        ListEmptyComponent={
          <EmptyState icon="🔍" message={`No documents in "${filter}".`} />
        }
      />
    </>
  );
}

function DocumentRow({ item, bookingId, onStartEsign }) {
  const status = item.status;
  const statusChip = {
    available:         { variant: 'success', label: 'AVAILABLE' },
    signed:            { variant: 'primary', label: 'SIGNED' },
    pending_signature: { variant: 'warning', label: 'NEEDS SIGN' },
  }[status] || { variant: 'neutral', label: (status || 'unknown').toUpperCase() };

  const onDownload = () => {
    // In production this would fetch a signed URL and Linking.openURL on it.
    showToast('success', 'Download started', `${item.name} will be saved to your device.`);
  };
  const onShare = () => {
    showToast('info', 'Sharing…', 'Opening share sheet.');
  };

  return (
    <Card padded>
      <View style={styles.docRow}>
        <View style={styles.docIcon}>
          <Text style={{ fontSize: 22 }}>📄</Text>
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.docName}>{item.name}</Text>
          <Text style={typography.caption}>
            {item.category} · {formatDate(item.date)} · {item.size}
          </Text>
          <View style={{ marginTop: 6 }}>
            <StatusChip label={statusChip.label} variant={statusChip.variant} />
          </View>
        </View>
        <View style={styles.docActions}>
          {status === 'pending_signature' ? (
            <TouchableOpacity style={[styles.docActionBtn, styles.signBtn]} onPress={() => onStartEsign(item)}>
              <Text style={styles.signBtnText}>Sign</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.docActionBtn} onPress={onDownload}>
                <Text style={styles.docActionText}>⬇</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.docActionBtn, { marginLeft: 6 }]} onPress={onShare}>
                <Text style={styles.docActionText}>↗</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Card>
  );
}

function WelcomeKitTab({ kit, loading }) {
  if (loading || !kit) {
    return <CardSkeleton />;
  }
  const images = kit.items.filter(i => i.kind === 'image');
  const pdf = kit.items.find(i => i.kind === 'pdf');
  const message = kit.items.find(i => i.kind === 'message');

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = screenWidth - spacing.lg * 2;

  return (
    <Card>
      <Text style={typography.h3}>🎁  Welcome to {kit.project?.name}!</Text>
      <Text style={[typography.bodyMuted, { marginTop: 6 }]}>
        Here's everything you need to know about your new home.
      </Text>

      {/* Image carousel */}
      <FlatList
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        data={images}
        keyExtractor={i => String(i.id)}
        style={{ marginTop: spacing.md, marginHorizontal: -spacing.lg }}
        renderItem={({ item }) => (
          <View style={{ width: cardWidth + spacing.lg * 2, paddingHorizontal: spacing.lg }}>
            <Image source={{ uri: item.url }} style={styles.kitImage} resizeMode="cover" />
            <Text style={styles.kitImageTitle}>{item.title}</Text>
            {item.caption ? <Text style={typography.caption}>{item.caption}</Text> : null}
          </View>
        )}
      />

      {/* Chairperson message */}
      {message ? (
        <View style={styles.messageCard}>
          <Text style={styles.messageTitle}>💌  {message.title}</Text>
          <Text style={styles.messageBody}>{message.url}</Text>
          <Text style={styles.messageCaption}>— {message.caption}</Text>
        </View>
      ) : null}

      {/* Brochure download */}
      {pdf ? (
        <Button
          title={`📥  Download ${pdf.title}`}
          variant="outline"
          style={{ marginTop: spacing.md }}
          onPress={() => showToast('success', 'Downloaded', `${pdf.title} saved to your device.`)}
        />
      ) : null}
    </Card>
  );
}

function RMTab({ details }) {
  if (!details?.rmPhone) {
    return (
      <EmptyState
        icon="🧑‍💼"
        title="No RM assigned yet"
        message="Your relationship manager will be assigned shortly. Please contact the front office."
      />
    );
  }
  const callRM = () => Linking.openURL(`tel:+91${details.rmPhone}`);
  const whatsappRM = () => Linking.openURL(`https://wa.me/91${details.rmPhone}`);
  const emailRM = () => details.rmEmail && Linking.openURL(`mailto:${details.rmEmail}`);

  return (
    <Card>
      <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 28 }}>👤</Text>
        </View>
        <Text style={typography.h3}>{details.rmName}</Text>
        <Text style={typography.caption}>Relationship Manager</Text>
      </View>
      <Button title={`📞  Call  +91 ${details.rmPhone}`} onPress={callRM} />
      <View style={{ height: spacing.sm }} />
      <Button title="💬  WhatsApp" variant="outline" onPress={whatsappRM} />
      {details.rmEmail ? (
        <>
          <View style={{ height: spacing.sm }} />
          <Button title={`✉  ${details.rmEmail}`} variant="ghost" onPress={emailRM} />
        </>
      ) : null}
    </Card>
  );
}

function EsignModal({ doc, esign, onClose, onComplete }) {
  if (!doc) return null;
  const ready = !!esign.signingUrl;

  return (
    <Modal visible={!!doc} animationType="slide" onRequestClose={onClose}>
      <View style={styles.esignWrap}>
        <View style={styles.esignHeader}>
          <View style={{ flex: 1 }}>
            <Text style={typography.h3}>Sign · {doc.name}</Text>
            <Text style={typography.caption}>
              {esign.envelopeId ? `Envelope ${esign.envelopeId}` : 'Preparing signing session…'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Text style={styles.esignClose}>×</Text>
          </TouchableOpacity>
        </View>

        {!ready ? (
          <View style={styles.esignLoader}>
            <ActivityIndicator size="large" color={palette.primary} />
            <Text style={{ marginTop: spacing.md, color: palette.textMuted }}>
              Starting secure signing session…
            </Text>
          </View>
        ) : (
          <WebView
            source={{ uri: esign.signingUrl }}
            style={{ flex: 1, backgroundColor: palette.surface }}
            startInLoadingState
            renderError={() => (
              <View style={styles.esignFallback}>
                <Text style={typography.h3}>🔒  Secure Signing</Text>
                <Text style={[typography.bodyMuted, { textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.md }]}>
                  In production this opens DocuSign / DigiSign. For now, tap below to simulate a successful signature.
                </Text>
              </View>
            )}
          />
        )}

        <View style={styles.esignFooter}>
          <Button
            title={esign.busy ? 'Working…' : 'I have signed — Confirm'}
            onPress={onComplete}
            loading={esign.busy}
            disabled={!ready}
          />
        </View>
      </View>
    </Modal>
  );
}

// =========================================================================
//                                  Styles
// =========================================================================

const styles = StyleSheet.create({
  summary: { marginBottom: spacing.md },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  muted: { ...typography.caption, letterSpacing: 0.6 },
  bookingId: { fontSize: 18, fontWeight: '700', color: palette.text, marginTop: 2 },
  unitRow: { flexDirection: 'row', marginTop: spacing.md },
  statValue: { fontSize: 14, fontWeight: '600', color: palette.text, marginTop: 2 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.md - 2 },
  tabActive: { backgroundColor: palette.surface },
  tabText: { fontSize: 12, fontWeight: '600', color: palette.textMuted },
  tabTextActive: { color: palette.primary },

  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.divider,
  },
  kvLabel: { fontSize: 13, color: palette.textMuted },
  kvValue: { fontSize: 13, color: palette.text, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

  pendingBanner: {
    marginTop: spacing.md,
    backgroundColor: '#FFFBEB',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: spacing.md,
  },
  pendingTitle: { fontWeight: '700', color: '#92400E', marginBottom: spacing.sm },
  pendingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  pendingDocName: { fontSize: 13, color: palette.text, fontWeight: '500', flex: 1 },
  pendingCta: { color: palette.primary, fontWeight: '700', fontSize: 12 },

  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: radius.pill, borderWidth: 1,
    borderColor: palette.border, backgroundColor: palette.surface,
    marginRight: 8,
  },
  filterChipActive: { borderColor: palette.primary, backgroundColor: '#EEF2FF' },
  filterChipText: { fontSize: 12, color: palette.textMuted, fontWeight: '600' },
  filterChipTextActive: { color: palette.primary },

  docRow: { flexDirection: 'row', alignItems: 'flex-start' },
  docIcon: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  docName: { fontSize: 13, fontWeight: '600', color: palette.text },
  docActions: { flexDirection: 'row', alignItems: 'center', marginLeft: spacing.sm },
  docActionBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  docActionText: { color: palette.primary, fontWeight: '700' },
  signBtn: { width: 'auto', paddingHorizontal: 12, backgroundColor: palette.primary, borderRadius: radius.md, height: 36 },
  signBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  kitImage: {
    width: '100%',
    height: 180,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceAlt,
  },
  kitImageTitle: { ...typography.label, marginTop: 8 },

  messageCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  messageTitle: { fontSize: 14, fontWeight: '700', color: '#9A3412' },
  messageBody: { fontSize: 13, color: '#7C2D12', marginTop: 6, lineHeight: 19, fontStyle: 'italic' },
  messageCaption: { fontSize: 11, color: '#9A3412', marginTop: 8 },

  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },

  esignWrap: { flex: 1, backgroundColor: palette.background },
  esignHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: 50, paddingBottom: spacing.md,
    backgroundColor: palette.surface,
    borderBottomWidth: 1, borderBottomColor: palette.divider,
  },
  esignClose: { fontSize: 26, color: palette.textMuted, paddingHorizontal: spacing.sm },
  esignLoader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  esignFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: palette.surface },
  esignFooter: {
    padding: spacing.lg,
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderTopColor: palette.divider,
  },
});
