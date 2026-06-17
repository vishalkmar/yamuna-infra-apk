import { MD3LightTheme } from 'react-native-paper';

export const palette = {
  primary: '#2E4374',
  primaryDark: '#1B264F',
  accent: '#F5A623',
  saffron: '#FF7722',
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  background: '#F7F8FB',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF1F6',
  text: '#1A1F36',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  divider: '#F1F3F8',
};

// Explicit default font. Some Android devices (MIUI/Xiaomi) mis-measure
// <Text> with no fontFamily under the New Architecture, collapsing text to
// zero height. Forcing 'sans-serif' (Roboto, always present) fixes it.
export const FONT = 'sans-serif';
export const FONT_BOLD = 'sans-serif-medium';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
};

export const typography = {
  h1: { fontFamily: FONT, fontSize: 26, fontWeight: '700', color: palette.text },
  h2: { fontFamily: FONT, fontSize: 20, fontWeight: '700', color: palette.text },
  h3: { fontFamily: FONT, fontSize: 17, fontWeight: '600', color: palette.text },
  body: { fontFamily: FONT, fontSize: 14, color: palette.text },
  bodyMuted: { fontFamily: FONT, fontSize: 14, color: palette.textMuted },
  caption: { fontFamily: FONT, fontSize: 12, color: palette.textMuted },
  label: { fontFamily: FONT, fontSize: 13, fontWeight: '600', color: palette.text },
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: palette.primary,
    secondary: palette.accent,
    background: palette.background,
    surface: palette.surface,
    error: palette.error,
    onPrimary: '#FFFFFF',
  },
};
