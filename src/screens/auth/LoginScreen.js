import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing, ScrollView, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';

import Input from '../../components/Input';
import Button from '../../components/Button';
import { Neu, ART, LOGO } from '../../components/neu';
import { sendOtp, setEmail } from '../../store/slices/authSlice';
import { showToast } from '../../utils/toastConfig';
import { palette, FONT, SERIF } from '../../theme';

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const { width: W } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const loading = useSelector(s => s.auth.loading);
  const [email, setEmailVal] = useState('');
  const [error, setError] = useState('');

  // Gentle entrance: logo → brand → card.
  const a = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    Animated.stagger(130, a.map(v => Animated.timing(v, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }))).start();
  }, [a]);
  const rise = v => ({ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] });

  const onSubmit = async () => {
    const value = email.trim().toLowerCase();
    if (!EMAIL_RX.test(value)) { setError('Enter a valid email address'); return; }
    setError('');
    try {
      await dispatch(sendOtp(value)).unwrap();
      dispatch(setEmail(value));
      showToast('success', 'OTP Sent', `OTP sent to ${value}. Check your inbox/spam.`);
      navigation.navigate('OTP');
    } catch (e) {
      // Show the server's real reason so we never claim "sent" when it failed.
      const msg = typeof e === 'string' ? e : (e?.message || 'Could not send OTP. Please try again.');
      setError(msg);
      showToast('error', 'Could not send OTP', msg);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* scenery */}
      <Image source={ART.gateScene} style={styles.gate} resizeMode="cover" />
      <View style={styles.arc} />
      <Image source={ART.leaves} style={styles.leaves} resizeMode="contain" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.logoWrap, rise(a[0])]}>
            <Neu variant="raisedLg" radius={34} style={styles.logoTile}>
              <Image source={LOGO} style={styles.logoImg} resizeMode="contain" />
            </Neu>
          </Animated.View>

          <Animated.View style={[{ alignItems: 'center' }, rise(a[1])]}>
            <Text style={styles.brand}>Shri Yamuna Infra</Text>
            <View style={styles.brandSwoosh} />
            <Text style={styles.tagline}>BUILDING BETTER COMMUNITIES</Text>
          </Animated.View>

          <Animated.View style={rise(a[2])}>
            <Neu variant="raisedLg" radius={34} style={styles.card}>
              <Image source={ART.cardBuildings} style={styles.cardArt} resizeMode="contain" />
              <Text style={styles.welcome}>Welcome to</Text>
              <Text style={styles.cardBrand}>Shri Yamuna Infra</Text>
              <Text style={styles.cardSub}>Your one-stop app for your home, services, payments, updates and more.</Text>
              <View style={styles.goldBar} />

              <Input
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmailVal}
                keyboardType="email-address"
                autoCapitalize="none"
                error={error}
                leftIcon={<Feather name="mail" size={20} color={palette.textMuted} />}
              />

              <Button title="Send OTP" arrow onPress={onSubmit} loading={loading} style={{ marginTop: 6 }} />

              <View style={styles.noteRow}>
                <Neu variant="raisedSm" radius={14} style={styles.lockTile}>
                  <Feather name="lock" size={18} color={palette.gold} />
                </Neu>
                <View style={styles.noteDivider} />
                <Text style={styles.note}>We'll email you a 6-digit verification code. Never share it with anyone.</Text>
              </View>
            </Neu>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const GATE_H = Math.round(W * 0.37);
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  gate: { position: 'absolute', left: 0, right: 0, bottom: 0, width: W, height: GATE_H },
  arc: { position: 'absolute', top: -W * 0.55, right: -W * 0.35, width: W * 1.1, height: W * 1.1, borderRadius: W, borderWidth: 26, borderColor: 'rgba(255,255,255,0.55)' },
  leaves: { position: 'absolute', top: -6, left: -6, width: W * 0.27, height: W * 0.23 },
  scroll: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: GATE_H * 0.55 },
  logoWrap: { alignItems: 'center' },
  logoTile: { width: 104, height: 104, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImg: { width: 176, height: 176 },
  brand: { fontFamily: SERIF, fontSize: Math.min(34, W * 0.085), color: palette.navy, marginTop: 20, fontWeight: '600' },
  brandSwoosh: { width: 120, height: 4, borderRadius: 4, backgroundColor: palette.gold, marginTop: 6, transform: [{ rotate: '-2deg' }] },
  tagline: { fontFamily: FONT, fontSize: 11.5, color: palette.navy, letterSpacing: 4, marginTop: 14 },
  card: { marginTop: 22, padding: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', overflow: 'hidden' },
  cardArt: { position: 'absolute', right: -10, top: 30, width: W * 0.34, height: W * 0.26, opacity: 0.9 },
  welcome: { fontFamily: FONT, fontSize: 17, fontWeight: '700', color: '#B8741A' },
  cardBrand: { fontFamily: SERIF, fontSize: Math.min(28, W * 0.068), fontWeight: '700', color: palette.navy, marginTop: 4 },
  cardSub: { fontFamily: FONT, fontSize: 14, color: palette.textMuted, marginTop: 8, lineHeight: 20, maxWidth: '72%' },
  goldBar: { width: 48, height: 5, borderRadius: 3, backgroundColor: palette.gold, marginTop: 12, marginBottom: 22 },
  noteRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18, paddingHorizontal: 4 },
  lockTile: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  noteDivider: { width: 1, height: 30, backgroundColor: '#D3DBE8', marginHorizontal: 12 },
  note: { flex: 1, fontFamily: FONT, fontSize: 12.5, color: palette.textMuted, lineHeight: 18 },
});
