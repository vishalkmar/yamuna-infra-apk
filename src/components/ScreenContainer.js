import React, { useContext } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderShownContext } from '@react-navigation/elements';
import { palette, spacing } from '../theme';

export default function ScreenContainer({
  children,
  scroll = true,
  padded = true,
  refreshing,
  onRefresh,
  edges = ['top', 'left', 'right'],
  style,
}) {
  // Inner screens already get the status-bar inset from the neumorphic stack
  // header; only header-less screens (home tabs, auth) need the top edge.
  const headerShown = useContext(HeaderShownContext);
  const safeEdges = headerShown ? edges.filter(e => e !== 'top') : edges;
  const inner = padded ? <View style={styles.padded}>{children}</View> : children;
  return (
    <SafeAreaView style={styles.safe} edges={safeEdges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, style]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />
            ) : undefined
          }
        >
          {inner}
        </ScrollView>
      ) : (
        <View style={[styles.flex, style]}>{inner}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1 },
  // Room for the floating neumorphic tab bar.
  scrollContent: { paddingBottom: 120 },
  padded: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
});
