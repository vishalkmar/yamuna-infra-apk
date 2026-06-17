import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { palette, radius, spacing } from '../theme';

const colorByType = {
  success: { bar: palette.success, bg: '#F0FDF4' },
  error: { bar: palette.error, bg: '#FEF2F2' },
  warning: { bar: palette.warning, bg: '#FFFBEB' },
  info: { bar: palette.info, bg: '#EFF6FF' },
};

function ToastView({ type, text1, text2 }) {
  const c = colorByType[type] || colorByType.info;
  return (
    <View style={[styles.toast, { backgroundColor: c.bg, borderLeftColor: c.bar }]}>
      {text1 ? <Text style={styles.title}>{text1}</Text> : null}
      {text2 ? <Text style={styles.message}>{text2}</Text> : null}
    </View>
  );
}

export const toastConfig = {
  success: props => <ToastView {...props} type="success" />,
  error: props => <ToastView {...props} type="error" />,
  warning: props => <ToastView {...props} type="warning" />,
  info: props => <ToastView {...props} type="info" />,
};

export const showToast = (type, title, message, duration = 3000) => {
  Toast.show({
    type,
    text1: title,
    text2: message,
    visibilityTime: duration,
    autoHide: true,
    topOffset: 50,
  });
};

const styles = StyleSheet.create({
  toast: {
    width: '92%',
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: { fontSize: 14, fontWeight: '700', color: palette.text },
  message: { fontSize: 13, color: palette.textMuted, marginTop: 2 },
});
