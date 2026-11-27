import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../components/Button';
import { verifyOtp, sendOtp } from '../../store/slices/authSlice';
import { showToast } from '../../utils/toastConfig';
import { Neu, ART, LOGO } from '../../components/neu';
import { palette, FONT, SERIF, NEU } from '../../theme';

const { width: W } = Dimensions.get('window');
const CELL = Math.min(56, Math.floor((W - 40 - 5 * 10) / 6));

const CELL_COUNT = 6;

export default function OTPScreen() {
  const dispatch = useDispatch();
  const { email, loading, otpAttempts } = useSelector(s => s.auth);

  const [digits, setDigits] = useState(Array(CELL_COUNT).fill(''));
  const [timer, setTimer] = useState(30);
  const inputs = useRef([]);
  const [focused, setFocused] = useState(0);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setInterval(() => setTimer(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [timer]);

  const handleChange = (text, idx) => {
    const value = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[idx] = value;
    setDigits(next);
    if (value && idx < CELL_COUNT - 1) inputs.current[idx + 1]?.focus();
  };

  const handleKeyPress = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const onVerify = async () => {
    const otp = digits.join('');
    if (otp.length !== CELL_COUNT) {
      showToast('error', 'Incomplete', 'Please enter all 6 digits.');
      return;
    }
    try {
      await dispatch(verifyOtp({ email, otp })).unwrap();
      showToast('success', 'Login Successful', 'Welcome back!');
      // No manual navigation — isLoggedIn flips to true and RootNavigator
      // swaps AuthStack → MainDrawer automatically.
    } catch (e) {
      const attemptsLeft = Math.max(0, 3 - (otpAttempts + 1));
      showToast(
        'error',
        'Invalid OTP',
        attemptsLeft > 0
          ? `Please try again. (${attemptsLeft} attempts remaining)`
          : 'Attempts exhausted. Please request a new OTP.',
      );
      setDigits(Array(CELL_COUNT).fill(''));
      inputs.current[0]?.focus();
    }
  };

  const onResend = async () => {
    if (timer > 0) return;
    try {
      await dispatch(sendOtp(email)).unwrap();
      showToast('success', 'OTP Resent', `New OTP sent to ${email}`);
      setTimer(30);
    } catch (e) {
      showToast('error', 'Failed', 'Could not resend OTP.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <Image source={ART.otpSwoosh} style={styles.swoosh} resizeMode="contain" />
      <Image source={ART.otpBuildings} style={styles.buildings} resizeMode="contain" />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center' }}>
          <Neu variant="raisedLg" radius={34} style={styles.logoTile}>
            <Image source={LOGO} style={styles.logoImg} resizeMode="contain" />
          </Neu>
          <View style={styles.brandRow}>
            <View style={styles.brandLine} />
            <Text style={styles.brand}>SHRI YAMUNA INFRA</Text>
            <View style={styles.brandLine} />
          </View>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.sub}>Enter the 6-digit code sent to</Text>
          <Text style={styles.email} numberOfLines={1}>{email}</Text>
        </View>

        <View style={styles.row}>
          {digits.map((d, i) => (
            <View key={i} style={[styles.cellWrap, focused === i && styles.cellActive]}>
              <TextInput
                ref={ref => (inputs.current[i] = ref)}
                value={d}
                onFocus={() => setFocused(i)}
                onChangeText={t => handleChange(t, i)}
                onKeyPress={e => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                autoFocus={i === 0}
                selectionColor={palette.navy}
                style={styles.cell}
              />
            </View>
          ))}
        </View>

        <View style={styles.resendRow}>
          <Neu variant="raisedSm" radius={14} style={styles.shield}>
            <Feather name="shield" size={18} color={palette.gold} />
          </Neu>
          <View style={styles.vDivider} />
          <Text style={styles.resendQ}>Didn't receive the code? </Text>
          <TouchableOpacity onPress={onResend} disabled={timer > 0}>
            <Text style={styles.resend}>{timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}</Text>
          </TouchableOpacity>
        </View>

        <Button title="Verify & Continue" arrow onPress={onVerify} loading={loading} style={{ marginTop: 26 }} />

        <View style={styles.secureRow}>
          <Feather name="lock" size={16} color={palette.textMuted} />
          <Text style={styles.secure}>Your code is secure and confidential.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  swoosh: { position: 'absolute', top: 0, left: 0, width: W * 0.5, height: W * 0.16 },
  buildings: { position: 'absolute', right: 0, bottom: 0, width: W * 0.49, height: W * 0.35, opacity: 0.85 },
  scroll: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: W * 0.4 },
  logoTile: { width: 104, height: 104, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImg: { width: 176, height: 176 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22 },
  brandLine: { width: 36, height: 2, backgroundColor: palette.gold, marginHorizontal: 12 },
  brand: { fontFamily: SERIF, fontSize: 17, color: palette.navy, letterSpacing: 1.2 },
  title: { fontFamily: FONT, fontSize: 34, fontWeight: '800', color: palette.navy, marginTop: 26 },
  sub: { fontFamily: FONT, fontSize: 16, color: palette.textMuted, marginTop: 10 },
  email: { fontFamily: FONT, fontSize: 17, fontWeight: '800', color: palette.navy, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 34 },
  cellWrap: { width: CELL, height: CELL * 1.08, borderRadius: 16, backgroundColor: palette.surface, boxShadow: NEU.raisedSm, alignItems: 'center', justifyContent: 'center' },
  cellActive: { borderWidth: 2, borderColor: palette.gold, boxShadow: NEU.glowGold },
  cell: { width: '100%', height: '100%', textAlign: 'center', fontSize: 24, fontWeight: '800', color: palette.navy, padding: 0 },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' },
  shield: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  vDivider: { width: 1, height: 26, backgroundColor: '#D3DBE8', marginHorizontal: 12 },
  resendQ: { fontFamily: FONT, fontSize: 14.5, color: palette.textMuted },
  resend: { fontFamily: FONT, fontSize: 14.5, fontWeight: '800', color: '#E8901A' },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  secure: { fontFamily: FONT, fontSize: 13.5, color: palette.textMuted, marginLeft: 8 },
});
