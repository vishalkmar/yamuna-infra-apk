import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { palette, spacing, NEU, FONT } from '../theme';

// Neumorphic buttons.
//  primary  — navy gradient pill with a blue glow (main call to action)
//  secondary— gold
//  outline / ghost — raised soft pill with navy text
//  danger   — soft pink pill with red text (e.g. Log Out)
// `arrow` adds a trailing → like the mockups' "Send OTP →".
export default function Button({
  title, onPress, variant = 'primary', loading = false, disabled = false, icon, style, fullWidth = true, arrow = false,
}) {
  const isDisabled = disabled || loading;
  const v = variants[variant] || variants.primary;
  const fg = textColor[variant] || '#fff';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[styles.base, v, fullWidth && styles.fullWidth, isDisabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text style={[styles.text, { color: fg }]} numberOfLines={1}>{title}</Text>
          {arrow ? <Feather name="arrow-right" size={20} color={fg} style={styles.arrow} /> : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54, paddingVertical: 14, paddingHorizontal: spacing.xl,
    borderRadius: 999, alignItems: 'center', justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: spacing.sm },
  arrow: { marginLeft: 12 },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.55 },
  text: { fontFamily: FONT, fontSize: 16.5, fontWeight: '700', letterSpacing: 0.2 },
});

const variants = {
  primary: { backgroundColor: palette.primary, experimental_backgroundImage: NEU.navyGradient, boxShadow: NEU.primary },
  secondary: { backgroundColor: palette.gold, boxShadow: NEU.glowGold },
  outline: { backgroundColor: palette.surface, boxShadow: NEU.raisedSm },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: '#FBE7EA', boxShadow: NEU.raisedSm },
};
const textColor = { primary: '#fff', secondary: '#fff', outline: palette.primary, ghost: palette.primary, danger: '#C62828' };
