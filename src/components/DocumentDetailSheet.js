import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Linking } from 'react-native';
import { useDispatch } from 'react-redux';
import { palette, radius, spacing, typography } from '../theme';
import Button from './Button';
import StatusChip from './StatusChip';
import { formatDate } from '../utils/format';
import { logDocumentView, logDocumentShare } from '../store/slices/documentSlice';
import { showToast } from '../utils/toastConfig';

const STATUS = {
  available:         { variant: 'success', label: 'AVAILABLE' },
  signed:            { variant: 'primary', label: 'SIGNED' },
  pending_signature: { variant: 'warning', label: 'NEEDS SIGN' },
};

const CATEGORY_ICON = {
  agreement: '📜',
  invoice:   '🧾',
  receipt:   '💳',
  noc:       '✅',
  tax:       '📑',
  other:     '📄',
};

export default function DocumentDetailSheet({ visible, doc, bookingId, onClose, onSign }) {
  const dispatch = useDispatch();
  if (!doc) return null;
  const status = STATUS[doc.status] || { variant: 'neutral', label: 'UNKNOWN' };
  const icon = CATEGORY_ICON[doc.category] || '📄';

  const trackAndOpen = (channel, opener) => {
    dispatch(logDocumentShare({ bookingId, ids: [doc.id], channel }));
    opener();
  };

  const shareWhatsApp = () =>
    trackAndOpen('whatsapp', () =>
      Linking.openURL(`whatsapp://send?text=${encodeURIComponent(doc.name + ' (Yamuna Infra)')}`),
    );
  const shareEmail = () =>
    trackAndOpen('email', () =>
      Linking.openURL(`mailto:?subject=${encodeURIComponent(doc.name)}&body=${encodeURIComponent('Please find attached.')}`),
    );
  const download = () => {
    dispatch(logDocumentView({ bookingId, docId: doc.id, source: 'download' }));
    showToast('success', 'Download started', `${doc.name} will be saved to your device.`);
  };
  const view = () => {
    dispatch(logDocumentView({ bookingId, docId: doc.id, source: 'detail' }));
    showToast('info', 'Opening document viewer…', '');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Text style={{ fontSize: 28 }}>{icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={typography.h3} numberOfLines={2}>{doc.name}</Text>
              <Text style={typography.caption}>
                {doc.category} · {formatDate(doc.date)}{doc.size ? ` · ${doc.size}` : ''}
              </Text>
              {doc.financialYear ? (
                <Text style={typography.caption}>FY {doc.financialYear}</Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statusRow}>
            <StatusChip label={status.label} variant={status.variant} />
            {Number(doc.viewCount) > 0 ? (
              <Text style={styles.viewCount}>{doc.viewCount} view{doc.viewCount > 1 ? 's' : ''}</Text>
            ) : null}
          </View>

          {doc.status === 'pending_signature' ? (
            <Button title="✍  Sign this document" onPress={() => { onClose?.(); onSign?.(doc); }} />
          ) : (
            <Button title="👁  View" onPress={view} />
          )}
          <View style={{ height: spacing.sm }} />
          <Button title="⬇  Download" variant="outline" onPress={download} />
          <View style={{ height: spacing.sm }} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Button title="WhatsApp" variant="ghost" onPress={shareWhatsApp} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Email" variant="ghost" onPress={shareEmail} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: palette.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  iconWrap: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  close: { fontSize: 26, color: palette.textMuted, paddingHorizontal: spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  viewCount: { ...typography.caption },
});
