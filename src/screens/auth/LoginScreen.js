import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
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
          <View style={styles.logoBadge}>
            <Image
              source={require('../../../logo.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </View>
          <Text style={[typography.h1, styles.center]}>Welcome to Yamuna Infra</Text>
          <Text style={[typography.bodyMuted, styles.center, { marginTop: 6 }]}>
            Log in with your email to access your account.
          </Text>
        </View>

        <View style={styles.form}>
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
            We'll email you a 6-digit verification code.
          </Text>
        </View>
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
  hint: { fontFamily: FONT, marginTop: spacing.md, color: palette.textMuted, fontSize: 12, lineHeight: 18 },
});
