import React, { useLayoutEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { WebView } from 'react-native-webview';

import { palette, spacing, radius, FONT } from '../../theme';
import { showToast } from '../../utils/toastConfig';

// In-app PDF viewer. Android's WebView can't render a PDF directly, so we load it
// through Google's document viewer — this also sidesteps any Cloudinary inline
// delivery quirks because Google fetches the (public) URL server-side.
export default function PdfViewerScreen({ route, navigation }) {
  const { url, title } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const openExternally = () =>
    url && Linking.openURL(url).catch(() => showToast('error', 'Cannot open', 'Invalid file link.'));

  useLayoutEffect(() => {
    navigation?.setOptions?.({
      title: title || 'Document',
      headerRight: () => (
        <TouchableOpacity onPress={openExternally} hitSlop={10}>
          <Text style={styles.headerBtn}>Open ↗</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, title, url]);

  if (!url) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>No document link.</Text>
      </View>
    );
  }

  const viewerUrl = `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;

  return (
    <View style={styles.flex}>
      <WebView
        source={{ uri: viewerUrl }}
        onLoadEnd={() => setLoading(false)}
        onError={() => { setLoading(false); setFailed(true); }}
        startInLoadingState
        style={styles.flex}
      />
      {loading && !failed ? (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.msg}>Loading document…</Text>
        </View>
      ) : null}
      {failed ? (
        <View style={styles.overlay}>
          <Text style={styles.msg}>Couldn’t preview this document.</Text>
          <TouchableOpacity style={styles.cta} onPress={openExternally}>
            <Text style={styles.ctaText}>Open in browser ↗</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: palette.background,
  },
  msg: { fontFamily: FONT, color: palette.textMuted, fontSize: 14, marginTop: spacing.md },
  headerBtn: { fontFamily: FONT, color: palette.primary, fontWeight: '700', fontSize: 14, paddingHorizontal: spacing.sm },
  cta: {
    marginTop: spacing.lg, backgroundColor: palette.primary,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.md,
  },
  ctaText: { fontFamily: FONT, color: '#fff', fontWeight: '700', fontSize: 14 },
});
