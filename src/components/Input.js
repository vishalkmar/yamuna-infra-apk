import React, { forwardRef } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { palette, radius, spacing, typography } from '../theme';

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
  label: { ...typography.label, marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: palette.text,
  },
  leftIcon: { marginRight: spacing.sm },
  rightIcon: { marginLeft: spacing.sm },
  disabled: { backgroundColor: palette.surfaceAlt, opacity: 0.7 },
  errorBorder: { borderColor: palette.error },
  errorText: { ...typography.caption, color: palette.error, marginTop: 4 },
  hint: { ...typography.caption, marginTop: 4 },
});
