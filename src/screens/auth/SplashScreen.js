import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { palette, spacing, FONT } from '../../theme';

// Pure presentational splash. RootNavigator shows this while booting, then
// swaps to AuthStack / MainDrawer based on auth state.
export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <Image
          source={require('../../../logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>Yamuna Infra</Text>
      <Text style={styles.tagline}>Customer Experience</Text>
      <ActivityIndicator color="#fff" style={{ marginTop: spacing.xl }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
  },
  logoWrap: {
    width: 132, height: 132, borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  logo: { width: 104, height: 104 },
  title: { fontFamily: FONT, fontSize: 28, fontWeight: '800', color: '#fff', marginTop: spacing.sm },
  tagline: { fontFamily: FONT, fontSize: 14, color: '#DBE3FF', marginTop: 4 },
});
