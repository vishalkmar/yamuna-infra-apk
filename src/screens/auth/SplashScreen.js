import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, StatusBar } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming, withSpring, withRepeat, withSequence,
  Easing, interpolate,
} from 'react-native-reanimated';
import { FONT } from '../../theme';
import { LOGO_PARTICLES } from '../../assets/logoParticles';

// Particle-assembly brand splash (Reanimated — runs on the UI thread).
//
//   0.0s  ~230 navy & gold dots fly in from a swirl around the screen
//   ~1.5s they settle into the "SY" monogram + Yamuna wave
//   ~1.6s the crisp logo fades in over them, a golden glint sweeps across
//   ~1.8s "Shri Yamuna Infra" types in letter by letter with a spring
//   ~2.6s tagline + progress bar, then RootNavigator moves on to login/home
//
// Particle targets are sampled from logo.png (src/assets/logoParticles.js),
// so the dots land exactly where the real logo pixels are.
const { width: W, height: H } = Dimensions.get('window');
// logo.png has generous transparent padding (the mark spans ~30–70% of it),
// so the canvas is drawn large and the mark itself ends up ~40% of the width.
const LOGO = Math.min(Math.round(W * 0.92), 380);
const DOT = Math.max(3.2, LOGO * 0.0105);
export const SPLASH_MS = 3500;

const NAME = 'Shri Yamuna Infra';
const GOLD = '#E9A55A';
const NAVY = '#0F2F6B';

// Deterministic pseudo-random so the swirl looks the same on every launch.
function rng(seed) {
  let s = seed % 2147483647;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function Particle({ x, y, color, from, delay }) {
  const t = useSharedValue(0);
  const fade = useSharedValue(1);
  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration: 1150, easing: Easing.out(Easing.cubic) }));
    fade.value = withDelay(1650, withTiming(0, { duration: 420 }));
  }, [t, fade, delay]);
  const style = useAnimatedStyle(() => {
    // Curved path: interpolate along a gentle arc rather than a straight line.
    const k = t.value;
    const arc = Math.sin(k * Math.PI) * from.curve;
    return {
      opacity: Math.min(1, k * 2.2) * fade.value,
      transform: [
        { translateX: from.x + (x - from.x) * k + arc },
        { translateY: from.y + (y - from.y) * k - arc * 0.6 },
        { scale: interpolate(k, [0, 0.7, 1], [0.2, 1.35, 1]) },
      ],
    };
  });
  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

function Letter({ ch, index }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(1750 + index * 48, withSpring(1, { damping: 11, stiffness: 140 }));
  }, [v, index]);
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, v.value * 1.4),
    transform: [
      { translateY: interpolate(v.value, [0, 1], [18, 0]) },
      { scale: interpolate(v.value, [0, 1], [0.4, 1]) },
    ],
  }));
  return <Animated.Text allowFontScaling={false} style={[styles.letter, style]}>{ch === ' ' ? ' ' : ch}</Animated.Text>;
}

export default function SplashScreen() {
  // Precompute particle targets (centred on the logo box) and swirl starts.
  const particles = useMemo(() => {
    const r = rng(7);
    return LOGO_PARTICLES.map(([px, py, c], i) => {
      const angle = r() * Math.PI * 2;
      const dist = Math.max(W, H) * (0.45 + r() * 0.35);
      return {
        key: i,
        x: (px - 0.5) * LOGO,
        y: (py - 0.5) * LOGO,
        color: c ? GOLD : NAVY,
        delay: Math.round(r() * 420 + (c ? 260 : 0)), // the wave settles last
        from: { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, curve: (r() - 0.5) * 160 },
      };
    });
  }, []);

  const logo = useSharedValue(0);
  const glint = useSharedValue(0);
  const glow = useSharedValue(0);
  const tag = useSharedValue(0);
  const bar = useSharedValue(0);
  useEffect(() => {
    glow.value = withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) });
    logo.value = withDelay(1550, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    glint.value = withDelay(1900, withTiming(1, { duration: 750, easing: Easing.inOut(Easing.cubic) }));
    tag.value = withDelay(2650, withTiming(1, { duration: 500 }));
    bar.value = withTiming(1, { duration: SPLASH_MS - 250, easing: Easing.inOut(Easing.quad) });
    // a slow breathing glow once everything has landed
    const t = setTimeout(() => {
      glow.value = withRepeat(withSequence(withTiming(1.12, { duration: 900 }), withTiming(1, { duration: 900 })), -1, true);
    }, 1500);
    return () => clearTimeout(t);
  }, [logo, glint, glow, tag, bar]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, glow.value) * 0.55, transform: [{ scale: glow.value }] }));
  const logoStyle = useAnimatedStyle(() => ({ opacity: logo.value, transform: [{ scale: interpolate(logo.value, [0, 1], [0.94, 1]) }] }));
  const glintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glint.value, [0, 0.15, 0.85, 1], [0, 0.85, 0.85, 0]),
    transform: [{ translateX: interpolate(glint.value, [0, 1], [-LOGO * 0.8, LOGO * 0.8]) }, { rotate: '18deg' }],
  }));
  const tagStyle = useAnimatedStyle(() => ({ opacity: tag.value, transform: [{ translateY: interpolate(tag.value, [0, 1], [10, 0]) }] }));
  const barStyle = useAnimatedStyle(() => ({ width: `${bar.value * 100}%` }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />

      <View style={styles.stage}>
        <Animated.View style={[styles.glow, glowStyle]} />
        {/* particles are positioned relative to the centre of this box */}
        <View style={styles.center}>
          {particles.map(p => <Particle key={p.key} {...p} />)}
        </View>
        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <Image source={require('../../../logo.png')} style={styles.logo} resizeMode="contain" />
          {/* glint clipped to the monogram area only */}
          <View pointerEvents="none" style={styles.glintClip}>
            <Animated.View style={[styles.glint, glintStyle]} />
          </View>
        </Animated.View>
      </View>

      <View style={styles.nameRow}>
        {NAME.split('').map((ch, i) => <Letter key={`${ch}${i}`} ch={ch} index={i} />)}
      </View>
      <Animated.View style={[styles.tagWrap, tagStyle]}>
        <View style={styles.rule} />
        <Text allowFontScaling={false} style={styles.tagline}>Radhe Radhe 🙏  ·  Your home in Vrindavan</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.track}><Animated.View style={[styles.fill, barStyle]} /></View>
        <Text allowFontScaling={false} style={styles.footerText}>Customer Experience</Text>
      </View>
    </View>
  );
}

const CREAM = '#FBF8F2';
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM, alignItems: 'center', justifyContent: 'center' },
  stage: { width: LOGO, height: LOGO, alignItems: 'center', justifyContent: 'center', marginTop: -30 },
  glow: {
    position: 'absolute', width: LOGO * 0.78, height: LOGO * 0.78, borderRadius: LOGO,
    backgroundColor: '#FCE3C2',
  },
  center: { position: 'absolute', left: LOGO / 2, top: LOGO / 2, width: 0, height: 0 },
  dot: { position: 'absolute', width: DOT, height: DOT, borderRadius: DOT / 2, marginLeft: -DOT / 2, marginTop: -DOT / 2 },
  logoWrap: { position: 'absolute', width: LOGO, height: LOGO },
  logo: { width: LOGO, height: LOGO },
  glintClip: { position: 'absolute', left: LOGO * 0.28, top: LOGO * 0.32, width: LOGO * 0.44, height: LOGO * 0.36, overflow: 'hidden' },
  glint: { position: 'absolute', top: -LOGO * 0.1, left: LOGO * 0.16, width: LOGO * 0.07, height: LOGO * 0.6, backgroundColor: 'rgba(255,255,255,0.55)' },
  nameRow: { flexDirection: 'row', marginTop: -LOGO * 0.2 },
  letter: { fontFamily: FONT, fontSize: Math.min(30, W * 0.075), fontWeight: '800', color: NAVY, letterSpacing: 0.3 },
  tagWrap: { alignItems: 'center', marginTop: 8 },
  rule: { width: 44, height: 3, borderRadius: 2, backgroundColor: GOLD, marginBottom: 10 },
  tagline: { fontFamily: FONT, fontSize: 13.5, color: '#5B6478' },
  footer: { position: 'absolute', bottom: 48, left: 0, right: 0, alignItems: 'center' },
  track: { width: W * 0.4, height: 3, borderRadius: 2, backgroundColor: 'rgba(15,47,107,0.12)', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: GOLD },
  footerText: { fontFamily: FONT, fontSize: 11, color: '#8A93A6', marginTop: 10, letterSpacing: 1.6, textTransform: 'uppercase' },
});

