import React, { forwardRef } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { palette, spacing, typography, NEU } from '../theme';

const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    value,
    onChangeText,
    placeholder,
    keyboardType,
    secureTextEntry,
    maxLength,
    multiline,
    numberOfLines,
    editable = true,
    leftIcon,
    rightIcon,
    style,
    ...rest
  },
  ref,
) {
  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrap,
          !editable && styles.disabled,
          error && styles.errorBorder,
          multiline && { minHeight: 96, alignItems: 'flex-start' },
        ]}
      >
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.textMuted}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          style={[styles.input, multiline && { textAlignVertical: 'top' }]}
          {...rest}
        />
        {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
});

export default Input;

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { ...typography.label, fontSize: 14, marginBottom: 8, marginLeft: 4 },
  // Neumorphic well: the field is pressed into the surface.
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
    boxShadow: NEU.inset,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: palette.text,
  },
  leftIcon: { marginRight: spacing.md, paddingRight: spacing.md, borderRightWidth: 1, borderRightColor: '#D3DBE8' },
  rightIcon: { marginLeft: spacing.sm },
  disabled: { opacity: 0.7 },
  errorBorder: { borderWidth: 1.5, borderColor: palette.error },
  errorText: { ...typography.caption, color: palette.error, marginTop: 4 },
  hint: { ...typography.caption, marginTop: 4 },
});
