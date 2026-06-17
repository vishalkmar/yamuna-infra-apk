import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

import Button from './Button';
import EmptyState from './EmptyState';
import { palette, spacing, typography } from '../theme';

// Reusable Cashfree (sandbox/prod) checkout. Loads the hosted payment link in a
// WebView and detects the backend return URL to resolve success/cancel.
// Shared by the Payments dashboard and every "Book → pay" flow.
export default function CashfreeCheckout({ visible, order, onClose, onSuccess, onCancel }) {
  const onNavChange = nav => {
    if (!nav?.url) return;
    if (nav.url.includes('/api/payment/return')) {
      const u = nav.url.toUpperCase();
      if (u.includes('CANCEL')) onCancel?.();
      else onSuccess?.(); // PAID or default → verify on backend
    }
  };

  if (!order) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.flex1}>
            <Text style={typography.h3}>Secure Checkout</Text>
            <Text style={typography.caption}>
              {order.environment === 'production' ? 'Cashfree' : 'Cashfree Sandbox'}
              {order.orderId ? ` · Order ${String(order.orderId).slice(-12)}` : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={10}><Text style={styles.close}>×</Text></TouchableOpacity>
        </View>

        {order.paymentLink ? (
          <WebView
            source={{ uri: order.paymentLink }}
            style={styles.flex1}
            startInLoadingState
            onNavigationStateChange={onNavChange}
            renderLoading={() => (
              <View style={styles.loaderOverlay}>
                <ActivityIndicator size="large" color={palette.primary} />
              </View>
            )}
            renderError={() => (
              <EmptyState icon="🌐" title="Couldn't load checkout" message="Please check your internet connection.">
                <Button title="Close" onPress={onClose} fullWidth={false} style={{ marginTop: spacing.md }} />
              </EmptyState>
            )}
          />
        ) : (
          <EmptyState icon="🔐" title="Preparing checkout…" />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  flex1: { flex: 1, backgroundColor: palette.surface },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: 50, paddingBottom: spacing.md,
    backgroundColor: palette.surface, borderBottomWidth: 1, borderBottomColor: palette.divider,
  },
  close: { fontSize: 26, color: palette.textMuted, paddingHorizontal: spacing.sm },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' },
});
