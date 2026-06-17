import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { palette, radius, spacing } from '../theme';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  fullWidth = true,
}) {
  const isDisabled = disabled || loading;
  const containerStyle = [
    styles.base,
    variants[variant],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];
  const textStyle = [styles.text, textVariants[variant]];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={containerStyle}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : palette.primary} />
      ) : (
        <View style={styles.row}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text style={textStyle}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: spacing.sm },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.55 },
  text: { fontSize: 15, fontWeight: '600' },
});

const variants = StyleSheet.create({
  primary: { backgroundColor: palette.primary },
  secondary: { backgroundColor: palette.accent },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: palette.primary,
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: palette.error },
});

const textVariants = StyleSheet.create({
  primary: { color: '#fff' },
  secondary: { color: '#fff' },
  outline: { color: palette.primary },
  ghost: { color: palette.primary },
  danger: { color: '#fff' },
});
