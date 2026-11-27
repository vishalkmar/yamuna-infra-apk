// Neumorphic design kit — the building blocks every screen is made of.
//
// One pale base colour; depth comes from a pair of shadows (white top-left,
// blue-grey bottom-right) for raised surfaces, or the same pair inset for
// pressed/inputs. Brand accents: navy gradient for primary actions and a gold
// underline/glow. Artwork (3D icons, illustrations) lives in assets/ui.
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { palette, NEU, SERIF, FONT, spacing } from '../theme';

export const ART = {
  leaves: require('../assets/ui/leaves.png'),
  gateScene: require('../assets/ui/gate_scene.png'),
  cardBuildings: require('../assets/ui/card_buildings.png'),
  headerBuildings: require('../assets/ui/header_buildings.png'),
  heroBuilding: require('../assets/ui/hero_building.png'),
  profileBuildings: require('../assets/ui/profile_buildings.png'),
  detailsBuildings: require('../assets/ui/details_buildings.png'),
  propertyThumb: require('../assets/ui/property_thumb.png'),
  otpSwoosh: require('../assets/ui/otp_swoosh.png'),
  otpBuildings: require('../assets/ui/otp_buildings.png'),
  wallet: require('../assets/ui/wallet.png'),
  sosSiren: require('../assets/ui/sos_siren.png'),
  // quick access
  qaDocket: require('../assets/ui/qa_docket.png'),
  qaPayments: require('../assets/ui/qa_payments.png'),
  qaProgress: require('../assets/ui/qa_progress.png'),
  qaSite: require('../assets/ui/qa_site.png'),
  qaSupport: require('../assets/ui/qa_support.png'),
  qaProfile: require('../assets/ui/qa_profile.png'),
  // services
  cleaning: require('../assets/ui/s2_cleaning.png'),
  housekeeping: require('../assets/ui/svc_housekeeping.png'),
  cook: require('../assets/ui/svc_cook.png'),
  meal: require('../assets/ui/s2_meal.png'),
  health: require('../assets/ui/svc_health.png'),
  mobility: require('../assets/ui/svc_mobility.png'),
  wellness: require('../assets/ui/svc_wellness.png'),
  spiritual: require('../assets/ui/svc_spiritual.png'),
  temples: require('../assets/ui/svc_temples.png'),
  darshan: require('../assets/ui/s2_darshan.png'),
  parcel: require('../assets/ui/s2_parcel.png'),
  maintenance: require('../assets/ui/s2_maintenance.png'),
  community: require('../assets/ui/s2_community.png'),
  events: require('../assets/ui/s2_events.png'),
  docket: require('../assets/ui/s2_docket.png'),
  support: require('../assets/ui/s2_support.png'),
  // home grid (slightly different art set, matches the home mockup)
  hCleaning: require('../assets/ui/svc_cleaning.png'),
  hMeal: require('../assets/ui/svc_meal.png'),
  hDarshan: require('../assets/ui/svc_darshan.png'),
  // profile menu
  pmDetails: require('../assets/ui/pm_details.png'),
  pmRewards: require('../assets/ui/pm_rewards.png'),
  pmAi: require('../assets/ui/pm_ai.png'),
  pmNotify: require('../assets/ui/pm_notify.png'),
  pmSettings: require('../assets/ui/pm_settings.png'),
  pmHelp: require('../assets/ui/pm_help.png'),
};
export const LOGO = require('../../logo.png');

// Raised (default), inset (pressed / input well) or flat neumorphic surface.
export function Neu({ children, style, variant = 'raised', radius = 22, color = palette.surface }) {
  const shadow = variant === 'inset' ? NEU.inset : variant === 'insetSm' ? NEU.insetSm
    : variant === 'raisedSm' ? NEU.raisedSm : variant === 'raisedLg' ? NEU.raisedLg : variant === 'flat' ? undefined : NEU.raised;
  return <View style={[{ backgroundColor: color, borderRadius: radius, boxShadow: shadow }, style]}>{children}</View>;
}

// Rounded square holding a 3D icon image (or a Feather glyph).
export function IconTile({ source, icon, size = 56, radius, iconColor = palette.primary, variant = 'raisedSm', tint, imageScale = 0.78 }) {
  return (
    <Neu variant={variant} radius={radius ?? Math.round(size * 0.3)} color={tint || palette.surface} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {source
        ? <Image source={source} style={{ width: size * imageScale, height: size * imageScale }} resizeMode="contain" />
        : <Feather name={icon || 'circle'} size={Math.round(size * 0.44)} color={iconColor} />}
    </Neu>
  );
}

// Round neumorphic icon button (bell, profile, back…), optional orange dot.
export function IconButton({ icon, onPress, size = 48, dot = false, color = palette.navy, style }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} hitSlop={6} style={style}>
      <Neu variant="raisedSm" radius={size / 2} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name={icon} size={Math.round(size * 0.44)} color={color} />
        {dot ? <View style={styles.dot} /> : null}
      </Neu>
    </TouchableOpacity>
  );
}

// Brand bar: logo tile | Shri Yamuna Infra / SUBTITLE … right actions.
export function BrandHeader({ subtitle = 'RESIDENT PORTAL', right, divider = true }) {
  return (
    <View style={styles.brandRow}>
      <Neu variant="raisedSm" radius={18} style={styles.logoTile}>
        <Image source={LOGO} style={styles.logoImg} resizeMode="contain" />
      </Neu>
      {divider ? <View style={styles.brandDivider} /> : <View style={{ width: 12 }} />}
      <View style={{ flex: 1 }}>
        <Text style={styles.brandName} numberOfLines={1}>Shri Yamuna Infra</Text>
        <Text style={styles.brandSub} numberOfLines={1}>{subtitle}</Text>
      </View>
      <View style={styles.brandRight}>{right}</View>
    </View>
  );
}

// Big page title + subtitle + gold underline, with an illustration on the right.
export function PageTitle({ title, subtitle, art, artStyle }) {
  return (
    <View style={styles.pageTitle}>
      {art ? <Image source={art} style={[styles.pageArt, artStyle]} resizeMode="contain" /> : null}
      <View>
        <Text style={styles.pageH} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
        {subtitle ? <Text style={styles.pageSub}>{subtitle}</Text> : null}
        <View style={styles.goldBar} />
      </View>
    </View>
  );
}

// Section heading with a gold left bar ("Quick Access").
export function GoldHeading({ title, subtitle, right, style }) {
  return (
    <View style={[styles.goldHead, style]}>
      <View style={styles.goldLeft} />
      <View style={{ flex: 1 }}>
        <Text style={styles.goldTitle}>{title}</Text>
        {subtitle ? <Text style={styles.goldSub}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

// Navy gradient fill for primary surfaces (buttons, hero card, active tab).
export const navyFill = { backgroundColor: palette.primary, experimental_backgroundImage: NEU.navyGradient };
export const heroFill = { backgroundColor: '#1B3670', experimental_backgroundImage: NEU.heroGradient };

export function Pill({ label, icon, tone = 'blue', style }) {
  const t = { blue: ['#E3ECFB', palette.primary], green: ['#DCF5E7', '#16794A'], gold: ['#FDF0DA', '#B26A00'], red: ['#FDE4E4', '#C62828'] }[tone] || ['#E3ECFB', palette.primary];
  return (
    <View style={[styles.pill, { backgroundColor: t[0] }, style]}>
      {icon ? <Feather name={icon} size={14} color={t[1]} style={{ marginRight: 6 }} /> : null}
      <Text style={[styles.pillText, { color: t[1] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: { position: 'absolute', top: 9, right: 10, width: 9, height: 9, borderRadius: 5, backgroundColor: '#F28C28', borderWidth: 1.5, borderColor: palette.surface },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  logoTile: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImg: { width: 92, height: 92 },
  brandDivider: { width: 1.5, height: 36, backgroundColor: '#C9D2E2', marginHorizontal: 12 },
  brandName: { fontFamily: SERIF, fontSize: 19, fontWeight: '700', color: palette.navy },
  brandSub: { fontFamily: FONT, fontSize: 10, fontWeight: '600', color: palette.textMuted, marginTop: 4, letterSpacing: 3.2 },
  brandRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pageTitle: { justifyContent: 'center', marginTop: 6, marginBottom: spacing.lg },
  pageArt: { position: 'absolute', right: -16, top: -6, width: '58%', height: 130, opacity: 0.98 },
  pageH: { fontFamily: FONT, fontSize: 27, fontWeight: '800', color: palette.navy },
  pageSub: { fontFamily: FONT, fontSize: 14.5, color: palette.textMuted, marginTop: 6, lineHeight: 20, maxWidth: '85%' },
  goldBar: { width: 44, height: 4, borderRadius: 2, backgroundColor: palette.gold, marginTop: 10 },
  goldHead: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.md },
  goldLeft: { width: 4, height: 24, borderRadius: 2, backgroundColor: palette.gold, marginRight: 12 },
  goldTitle: { fontFamily: FONT, fontSize: 20, fontWeight: '800', color: palette.navy },
  goldSub: { fontFamily: FONT, fontSize: 13, color: palette.textMuted, marginTop: 2 },
  pill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  pillText: { fontFamily: FONT, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
});
