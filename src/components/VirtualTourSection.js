import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Modal, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { palette, radius, spacing, typography } from '../theme';
import { showToast } from '../utils/toastConfig';

const ICONS = {
  matterport: '🏠',
  '360_video': '🎥',
  video_call: '📞',
  maps:       '🗺️',
  brochure:   '📘',
};

const TITLE_FALLBACK = {
  matterport: '360° Virtual Tour',
  '360_video': 'Drone Walkthrough',
  video_call: 'Live Sales Call',
  maps: 'Open in Google Maps',
  brochure: 'Project Brochure',
};

export default function VirtualTourSection({ tours = [] }) {
  const [webUrl, setWebUrl] = useState(null);

  if (!tours.length) return null;

  const open = tour => {
    switch (tour.kind) {
      case 'matterport':
      case '360_video':
        showToast('info', 'Loading 360° virtual tour…', '');
        setWebUrl(tour.url);
        break;
      case 'video_call':
      case 'maps':
      case 'brochure':
      default:
        Linking.openURL(tour.url).catch(() =>
          showToast('error', "Can't open link", tour.url),
        );
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={[typography.h3, styles.title]}>Take a virtual tour</Text>
      <View style={styles.grid}>
        {tours.map(t => (
          <TouchableOpacity
            key={t.id}
            style={styles.tile}
            activeOpacity={0.85}
            onPress={() => open(t)}
          >
            <Text style={styles.icon}>{ICONS[t.kind] || '🔗'}</Text>
            <Text style={styles.label} numberOfLines={2}>
              {t.label || TITLE_FALLBACK[t.kind] || 'Open'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal visible={!!webUrl} animationType="slide" onRequestClose={() => setWebUrl(null)}>
        <View style={{ flex: 1, backgroundColor: palette.background }}>
          <View style={styles.modalHeader}>
            <Text style={typography.h3}>Virtual Tour</Text>
            <TouchableOpacity onPress={() => setWebUrl(null)} hitSlop={10}>
              <Text style={styles.close}>×</Text>
            </TouchableOpacity>
          </View>
          <WebView
            source={{ uri: webUrl || '' }}
            style={{ flex: 1 }}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color={palette.primary} />
              </View>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  title: { marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: {
    width: '48.5%',
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: palette.divider,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 90,
    justifyContent: 'flex-start',
  },
  icon: { fontSize: 26, marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600', color: palette.text },

  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 50, paddingBottom: spacing.md,
    backgroundColor: palette.surface,
    borderBottomWidth: 1, borderBottomColor: palette.divider,
  },
  close: { fontSize: 26, color: palette.textMuted, paddingHorizontal: spacing.sm },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.surface,
    alignItems: 'center', justifyContent: 'center',
  },
});
