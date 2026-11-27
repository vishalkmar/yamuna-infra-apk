import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, FONT } from '../theme';
import { IconButton } from '../components/neu';

// Neumorphic stack header: round raised back button + bold navy title on the
// page colour (no bar, no hairline) — used by every inner screen.
export function NeuStackHeader({ navigation, options, route, back }) {
  const insets = useSafeAreaInsets();
  const title = options.title ?? route.name;
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 10 }]}>
      {back ? <IconButton icon="arrow-left" onPress={() => navigation.goBack()} size={48} color={palette.primary} /> : <View style={{ width: 48 }} />}
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {options.headerRight ? options.headerRight({}) : null}
    </View>
  );
}

export const neuScreenOptions = {
  header: props => <NeuStackHeader {...props} />,
  contentStyle: { backgroundColor: palette.background },
};

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: palette.background },
  title: { flex: 1, fontFamily: FONT, fontSize: 21, fontWeight: '800', color: palette.navy, marginLeft: 16 },
});
