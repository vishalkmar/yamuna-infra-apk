import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing, Dimensions, StatusBar } from 'react-native';
import { palette, FONT } from '../../theme';

// Animated brand splash (~2.6 s). RootNavigator shows this while booting and
// then swaps to AuthStack / MainDrawer based on auth state.
//
// Sequence: soft halo pulses in → logo card springs up → golden "Yamuna" wave
// sweeps under it → name + tagline rise → a saffron progress line fills.
// Uses the core Animated API with the native driver everywhere it can, so it
// runs smoothly even on low-end phones.
const { width: W } = Dimensions.get('window');
const CARD = Math.min(148, Math.round(W * 0.36));
export const SPLASH_MS = 2600;

export default function SplashScreen() {
  const halo = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const wave = useRef(new Animated.Value(0)).current;
  const title = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(halo, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(150),
        Animated.spring(pop, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(650),
        Animated.timing(wave, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(title, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(bar, { toValue: 1, duration: SPLASH_MS - 200, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
    ]).start();
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const t = setTimeout(() => loop.start(), 1000);
    return () => { clearTimeout(t); loop.stop(); };
  }, [halo, pop, wave, title, bar, breathe]);

  const cardScale = Animated.multiply(
    pop.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
    breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] }),
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={palette.primaryDark} />

      <View style={{ width: CARD, height: CARD, marginBottom: 26, alignItems: 'center', justifyContent: 'center' }}>
      {/* soft concentric halos */}
      {[1.9, 1.45].map((s, i) => (
        <Animated.View
          key={s}
          style={[styles.halo, {
            width: CARD * s, height: CARD * s, borderRadius: (CARD * s) / 2,
            left: (CARD - CARD * s) / 2, top: (CARD - CARD * s) / 2,
            opacity: halo.interpolate({ inputRange: [0, 1], outputRange: [0, i ? 0.16 : 0.08] }),
            transform: [{ scale: halo.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
          }]}
        />
      ))}

      <Animated.View style={[styles.card, { width: CARD, height: CARD, borderRadius: CARD * 0.26, opacity: pop, transform: [{ scale: cardScale }] }]}>
        <Image source={require('../../../logo.png')} style={{ width: CARD * 0.86, height: CARD * 0.86 }} resizeMode="contain" />
        {/* golden shimmer sweeping across the Yamuna wave */}
        <Animated.View
          pointerEvents="none"
          style={[styles.shine, {
            height: CARD * 1.4,
            transform: [
              { translateX: wave.interpolate({ inputRange: [0, 1], outputRange: [-CARD, CARD] }) },
              { rotate: '20deg' },
            ],
            opacity: wave.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 0.55, 0.55, 0] }),
          }]}
        />
      </Animated.View>
      </View>

      <Animated.View style={{ alignItems: 'center', opacity: title, transform: [{ translateY: title.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }}>
        <Text style={styles.title} allowFontScaling={false}>Shri Yamuna Infra</Text>
        <View style={styles.divider} />
        <Text style={styles.tagline} allowFontScaling={false}>Radhe Radhe 🙏  ·  Your home in Vrindavan</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        </View>
        <Text style={styles.footerText} allowFontScaling={false}>Customer Experience</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primary },
  halo: { position: 'absolute', backgroundColor: '#FFFFFF' },
  card: {
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 14,
  },
  shine: { position: 'absolute', width: 34, backgroundColor: 'rgba(245,166,35,0.35)' },
  title: { fontFamily: FONT, fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: 0.4 },
  divider: { width: 46, height: 3, borderRadius: 2, backgroundColor: palette.accent, marginVertical: 10 },
  tagline: { fontFamily: FONT, fontSize: 13.5, color: '#DBE3FF' },
  footer: { position: 'absolute', bottom: 46, left: 0, right: 0, alignItems: 'center' },
  track: { width: W * 0.42, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: palette.accent },
  footerText: { fontFamily: FONT, fontSize: 11, color: '#A8B2D4', marginTop: 10, letterSpacing: 1.6, textTransform: 'uppercase' },
});
