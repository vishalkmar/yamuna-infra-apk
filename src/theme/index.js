import { MD3LightTheme } from 'react-native-paper';

// Neumorphic palette (soft UI): one pale blue-grey base that every surface
// shares, with depth coming from paired light/dark shadows (see NEU below).
export const palette = {
  primary: '#1E3A78',
  primaryDark: '#0F2557',
  navy: '#0F2557',
  accent: '#F2A93B',
  gold: '#F2A93B',
  saffron: '#FF7722',
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  background: '#EDF1F8',
  surface: '#F1F4FA',
  surfaceAlt: '#E6EBF4',
  text: '#0F2557',
  textMuted: '#5D6B82',
  border: '#DCE3EE',
  divider: '#E3E8F1',
};

// Neumorphic depth. React Native 0.85 (New Architecture) renders CSS-style
// boxShadow lists, including inset shadows, on Android and iOS.
export const NEU = {
  raised: '-6px -6px 14px rgba(255,255,255,0.95), 7px 8px 18px rgba(150,166,198,0.42)',
  raisedSm: '-3px -3px 8px rgba(255,255,255,0.95), 4px 5px 11px rgba(150,166,198,0.40)',
  raisedLg: '-10px -10px 22px rgba(255,255,255,0.95), 12px 14px 28px rgba(150,166,198,0.40)',
  inset: 'inset 4px 4px 9px rgba(150,166,198,0.42), inset -4px -4px 9px rgba(255,255,255,0.95)',
  insetSm: 'inset 2px 2px 5px rgba(150,166,198,0.40), inset -2px -2px 5px rgba(255,255,255,0.95)',
  primary: '0px 10px 22px rgba(23,52,120,0.38), -4px -4px 10px rgba(255,255,255,0.9)',
  glowGold: '0px 10px 22px rgba(242,169,59,0.45)',
  danger: '0px 8px 18px rgba(220,38,38,0.35)',
  navyGradient: 'linear-gradient(135deg, #2B4D93 0%, #1E3A78 45%, #0F2557 100%)',
  heroGradient: 'linear-gradient(135deg, #2A4A8C 0%, #1B3670 55%, #13285A 100%)',
};
export const SERIF = 'serif';

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
  sm: 8,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const typography = {
  h1: { fontFamily: FONT, fontSize: 26, fontWeight: '800', color: palette.text },
  h2: { fontFamily: FONT, fontSize: 20, fontWeight: '800', color: palette.text },
  h3: { fontFamily: FONT, fontSize: 17, fontWeight: '700', color: palette.text },
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
