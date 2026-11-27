import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, NEU, FONT } from '../theme';
import useChatOpen from '../hooks/useChatOpen';

// Floating neumorphic tab bar: a raised pill; the active tab is a navy
// gradient capsule with a gold glow underneath (as in the mockups).
const ICONS = { HomeTab: 'home', ResidentTab: 'grid', CommunityTab: 'users', AssistantTab: 'message-circle', ProfileTab: 'user' };

export default function NeuTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const chatOpen = useChatOpen();
  if (chatOpen) return null;
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <TouchableOpacity key={route.key} onPress={onPress} activeOpacity={0.85} style={styles.item} accessibilityRole="button" accessibilityState={focused ? { selected: true } : {}}>
              {focused ? (
                <View style={styles.activeOuter}>
                  <View style={styles.active}>
                    <Feather name={ICONS[route.name] || 'circle'} size={22} color="#fff" />
                    <Text style={styles.activeLabel} numberOfLines={1}>{label}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.idle}>
                  <Feather name={ICONS[route.name] || 'circle'} size={22} color={palette.navy} />
                  <Text style={styles.label} numberOfLines={1}>{label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 10 },
  bar: {
    flexDirection: 'row', alignItems: 'center', height: 74, borderRadius: 37, paddingHorizontal: 4,
    backgroundColor: palette.surface, boxShadow: NEU.raisedLg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)',
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  idle: { alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  label: { fontFamily: FONT, fontSize: 11, fontWeight: '600', color: palette.navy, marginTop: 3 },
  activeOuter: { borderRadius: 26, boxShadow: NEU.glowGold },
  active: {
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 9, minWidth: 62,
    borderRadius: 26, backgroundColor: palette.primary, experimental_backgroundImage: NEU.navyGradient,
  },
  activeLabel: { fontFamily: FONT, fontSize: 11, fontWeight: '700', color: '#fff', marginTop: 3 },
});

// Space screens must leave at the bottom so content isn't hidden by the bar.
export const TAB_BAR_SPACE = 110;
