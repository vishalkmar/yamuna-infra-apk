import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { sendOtp, setEmail } from '../../store/slices/authSlice';
import { showToast } from '../../utils/toastConfig';
import { palette, spacing, typography, FONT } from '../../theme';

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const loading = useSelector(s => s.auth.loading);
  const [email, setEmailVal] = useState('');
  const [error, setError] = useState('');
  // Gentle entrance right after the splash: logo, then text, then the form.
  const a = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    Animated.stagger(120, a.map(v => Animated.timing(v, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }))).start();
  }, [a]);
  const rise = v => ({ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] });

  const onSubmit = async () => {
    const value = email.trim().toLowerCase();
    if (!EMAIL_RX.test(value)) {
      setError('Enter a valid email address');
      return;
    }
    setError('');
    try {
      await dispatch(sendOtp(value)).unwrap();
      dispatch(setEmail(value));
      showToast('success', 'OTP Sent', `OTP sent to ${value}. Check your inbox/spam.`);
      navigation.navigate('OTP');
    } catch (e) {
      // Show the REAL reason from the server (e.g. email could not be delivered),
      // so we never claim "sent" when the email actually failed.
      const msg = typeof e === 'string' ? e : (e?.message || 'Could not send OTP. Please try again.');
      setError(msg);
      showToast('error', 'Could not send OTP', msg);
    }
  };

  return (
    <ScreenContainer>
      <View>
        <View style={styles.header}>
          <Animated.View style={[styles.logoBadge, rise(a[0])]}>
            <Image
              source={require('../../../logo.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </Animated.View>
          <Animated.View style={rise(a[1])}>
            <Text style={styles.kicker}>RADHE RADHE 🙏</Text>
            <Text style={[typography.h1, styles.center]}>Welcome to Shri Yamuna Infra</Text>
            <Text style={[typography.bodyMuted, styles.center, { marginTop: 6 }]}>
              Log in with your email to see your home, payments, services and more.
            </Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.form, styles.formCard, rise(a[2])]}>
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmailVal}
            keyboardType="email-address"
            autoCapitalize="none"
            error={error}
          />

          <Button title="Send OTP" onPress={onSubmit} loading={loading} />

          <Text style={styles.hint}>
            🔒 We'll email you a 6-digit verification code. Never share it with anyone.
          </Text>
        </Animated.View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { marginTop: spacing.xxl, marginBottom: spacing.xl, alignItems: 'center' },
  center: { textAlign: 'center' },
  logoBadge: {
    width: 96, height: 96, borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1, borderColor: palette.divider,
    shadowColor: palette.primary, shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  logoImg: { width: 72, height: 72 },
  form: { marginTop: spacing.md },
  formCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: spacing.lg, borderWidth: 1, borderColor: palette.divider,
    shadowColor: palette.primary, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },
  kicker: { fontFamily: FONT, textAlign: 'center', color: palette.accent, fontWeight: '700', fontSize: 12, letterSpacing: 1.2, marginBottom: 4 },
  hint: { fontFamily: FONT, marginTop: spacing.md, color: palette.textMuted, fontSize: 12, lineHeight: 18 },
});
