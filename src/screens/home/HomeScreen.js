import React, { useEffect } from 'react';
import useUnreadCount from '../../hooks/useUnreadCount';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSelector, useDispatch } from 'react-redux';
import ScreenContainer from '../../components/ScreenContainer';
import { Neu, IconTile, IconButton, BrandHeader, GoldHeading, ART, heroFill, navyFill } from '../../components/neu';
import { palette, FONT, NEU } from '../../theme';
import { formatINR, formatDate, daysUntil } from '../../utils/format';
import { loadMyProperties, loadProgress } from '../../store/slices/projectSlice';
import { loadMyProperties as loadPayProperties, loadSchedule as loadPaySchedule } from '../../store/slices/paymentSlice';

// Designed at 400dp and scaled down (never up) so it fits 320–360dp phones.
const W = Dimensions.get('window').width;
const SCALE = Math.min(1, Math.max(0.8, W / 400));
const ms = n => Math.round(n * SCALE);
const PAD = 18;
const QA_GAP = 8;
const QA = Math.floor((W - PAD * 2 - QA_GAP * 5) / 6);
const SVC_COLS = W < 340 ? 3 : 4;
const SVC_GAP = 14;
const SVC_W = Math.floor((W - PAD * 2 - SVC_GAP * (SVC_COLS - 1)) / SVC_COLS);

const QUICK = [
  { key: 'BookingDocket', label: 'Booking\nDocket', art: ART.qaDocket },
  { key: 'PaymentDashboard', label: 'Payments', art: ART.qaPayments },
  { key: 'ConstructionTracker', label: 'Progress', art: ART.qaProgress },
  { key: 'SiteVisit', label: 'Site\nOverview', art: ART.qaSite },
  { key: 'Support', label: 'Support', art: ART.qaSupport },
  { key: 'ProfileTab', label: 'Profile', art: ART.qaProfile },
];

const SERVICES = [
  { key: 'HomeServices', label: 'Cleaning', art: ART.hCleaning },
  { key: 'Housekeeping', label: 'Housekeeping', art: ART.housekeeping },
  { key: 'CookBooking', label: 'Book a Cook', art: ART.cook },
  { key: 'MealOrder', label: 'Meal Tiffin', art: ART.hMeal },
  { key: 'HealthcareScreen', label: 'Healthcare', art: ART.health },
  { key: 'Wheelchair', label: 'Mobility Aid', art: ART.mobility },
  { key: 'WellnessScreen', label: 'Wellness', art: ART.wellness },
  { key: 'SpiritualScreen', label: 'Spiritual', art: ART.spiritual },
  { key: 'TempleDirectoryScreen', label: 'Temples', art: ART.temples },
  { key: 'Darshan', label: 'Darshan', art: ART.hDarshan },
];

export default function HomeScreen({ navigation }) {
  const unread = useUnreadCount();
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);
  const { property, properties, selectedPropertyId, progressPct } = useSelector(s => s.project);
  const paySchedule = useSelector(s => s.payment.schedule);
  const paySelectedId = useSelector(s => s.payment.selectedPropertyId);

  useEffect(() => { dispatch(loadMyProperties()); dispatch(loadPayProperties()); }, [dispatch]);
  useEffect(() => { if (selectedPropertyId) dispatch(loadProgress(selectedPropertyId)); }, [dispatch, selectedPropertyId]);
  useEffect(() => { if (paySelectedId) dispatch(loadPaySchedule(paySelectedId)); }, [dispatch, paySelectedId]);

  const unitLabel = property?.flatNo
    ? [property.tower && `Tower ${property.tower}`, property.flatNo].filter(Boolean).join('-')
    : (property?.label || properties[0]?.flatNo || '—');
  const projectName = property?.projectName || properties[0]?.projectName || 'Your residence';
  const hasProperty = properties.length > 0;
  const completed = property?.workStatus === 'completed';
  const pct = hasProperty ? Math.max(0, Math.min(100, Number(progressPct) || 0)) : 0;

  const nextDue = paySchedule?.nextDue || null;
  const dueIn = nextDue?.dueDate ? daysUntil(nextDue.dueDate) : null;

  return (
    <ScreenContainer>
      <BrandHeader
        subtitle="RESIDENT PORTAL"
        right={(
          <>
            <IconButton icon="bell" dot={unread} onPress={() => navigation.navigate('NotificationsScreen')} />
            <IconButton icon="user" onPress={() => navigation.navigate('ProfileTab')} />
          </>
        )}
      />

      {/* Welcome */}
      <View style={styles.welcome}>
        <Image source={ART.headerBuildings} style={styles.welcomeArt} resizeMode="contain" />
        <Text style={styles.welcomeSmall}>Welcome back,</Text>
        <Text style={styles.welcomeName} numberOfLines={1} adjustsFontSizeToFit>{user?.name || 'Resident'} 👋</Text>
      </View>

      {/* Hero unit card */}
      <TouchableOpacity activeOpacity={0.92} onPress={() => navigation.navigate('ConstructionTracker')}>
        <View style={[styles.hero, heroFill]}>
          <Image source={ART.heroBuilding} style={styles.heroArt} resizeMode="contain" />
          <View style={styles.heroTop}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.heroLabel}>YOUR UNIT</Text>
              <Text style={styles.heroUnit} numberOfLines={1} adjustsFontSizeToFit>{unitLabel}</Text>
              <Text style={styles.heroProject} numberOfLines={1}>{projectName}</Text>
            </View>
            <View style={styles.activePill}>
              <Text style={styles.activeText}>{completed ? 'COMPLETED' : 'ACTIVE'}</Text>
              <View style={styles.activeDot} />
            </View>
          </View>
          <View style={styles.track}><View style={[styles.fill, { width: `${pct}%` }]} /></View>
          <Text style={styles.heroProgress}>
            {hasProperty ? <>Construction Progress: <Text style={{ fontWeight: '800', color: '#fff' }}>{pct}%</Text></> : 'No property linked yet'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Next due */}
      <Neu variant="raised" radius={26} style={styles.due}>
        <IconTile source={ART.wallet} size={ms(60)} radius={18} imageScale={0.7} />
        <View style={styles.vDivider} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dueLabel}>NEXT DUE</Text>
          {nextDue ? (
            <>
              <Text style={styles.dueAmount} numberOfLines={1} adjustsFontSizeToFit>{formatINR(Number(nextDue.amount) + Number(nextDue.lateFee || 0))}</Text>
              <Text style={styles.dueMeta} numberOfLines={1}>{nextDue.label} · {formatDate(nextDue.dueDate)}</Text>
              {dueIn != null ? (
                <Text style={[styles.dueMeta, { color: dueIn < 0 ? '#D32F2F' : '#16794A', fontWeight: '600' }]}>
                  {dueIn >= 0 ? `${dueIn} days left` : `${Math.abs(dueIn)} days overdue`}
                </Text>
              ) : null}
            </>
          ) : (
            <>
              <Text style={styles.dueAmount}>—</Text>
              <Text style={styles.dueMeta}>No dues pending</Text>
            </>
          )}
        </View>
        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('PaymentDashboard')} style={[styles.payBtn, navyFill]}>
          <Text style={styles.payText}>{nextDue ? 'Pay Now' : 'View'}</Text>
          <Feather name="arrow-right" size={16} color="#fff" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </Neu>

      <GoldHeading title="Quick Access" />
      <View style={styles.qaRow}>
        {QUICK.map(q => (
          <TouchableOpacity key={q.key} activeOpacity={0.8} style={{ width: QA, alignItems: 'center', overflow: 'visible' }} onPress={() => navigation.navigate(q.key)}>
            <IconTile source={q.art} size={QA} radius={Math.round(QA * 0.3)} imageScale={0.7} />
            <Text style={styles.qaLabel} numberOfLines={2}>{q.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <GoldHeading title="Resident Services" subtitle="Lifestyle, health, spiritual & community" />
      <View style={styles.grid}>
        {SERVICES.map(s => (
          <TouchableOpacity
            key={s.key}
            activeOpacity={0.8}
            style={{ width: SVC_W, alignItems: 'center', marginBottom: 14 }}
            onPress={() => navigation.navigate('ResidentTab', { screen: s.key, initial: false })}
          >
            <IconTile source={s.art} size={Math.min(ms(72), SVC_W - 8)} radius={22} imageScale={0.74} />
            <Text style={styles.svcLabel} numberOfLines={1}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SOS */}
      <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('SOSScreen')} style={styles.sos}>
        <Image source={ART.sosSiren} style={styles.siren} resizeMode="contain" />
        <Text style={styles.sosText} numberOfLines={1} adjustsFontSizeToFit>Emergency SOS — Hold to Activate</Text>
        <View style={styles.sosBtn}><Text style={styles.sosBtnText}>SOS</Text></View>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  welcome: { minHeight: ms(108), justifyContent: 'center', marginBottom: 6 },
  welcomeArt: { position: 'absolute', right: -PAD - 6, top: -16, width: W * 0.46, height: ms(112) },
  welcomeSmall: { fontFamily: FONT, fontSize: ms(16), color: palette.textMuted },
  welcomeName: { fontFamily: FONT, fontSize: ms(26), fontWeight: '800', color: palette.navy, marginTop: 2, maxWidth: '58%' },

  hero: { borderRadius: 26, padding: ms(22), overflow: 'hidden', boxShadow: '0px 14px 26px rgba(19,40,90,0.35), -6px -6px 14px rgba(255,255,255,0.9)' },
  heroArt: { position: 'absolute', right: 0, bottom: 0, width: W * 0.3, height: ms(96), opacity: 0.5 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start' },
  heroLabel: { fontFamily: FONT, color: '#AEBBDA', fontSize: ms(12.5), fontWeight: '700', letterSpacing: 1.6 },
  heroUnit: { fontFamily: FONT, color: '#fff', fontSize: ms(29), fontWeight: '800', marginTop: 4 },
  heroProject: { fontFamily: FONT, color: '#DCE4F7', fontSize: ms(15.5), marginTop: 2 },
  activePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5F8EC', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  activeText: { fontFamily: FONT, fontSize: ms(12), fontWeight: '800', color: '#15803D', letterSpacing: 0.6 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A', marginLeft: 6 },
  track: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.28)', marginTop: ms(20), width: '68%', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: palette.gold },
  heroProgress: { fontFamily: FONT, color: '#DCE4F7', fontSize: ms(14.5), marginTop: 12 },

  due: { flexDirection: 'row', alignItems: 'center', padding: ms(16), marginTop: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },
  vDivider: { width: 1, height: '70%', backgroundColor: '#D3DBE8', marginHorizontal: ms(14) },
  dueLabel: { fontFamily: FONT, fontSize: ms(12.5), color: palette.textMuted, letterSpacing: 0.6 },
  dueAmount: { fontFamily: FONT, fontSize: ms(26), fontWeight: '800', color: palette.navy, marginTop: 2 },
  dueMeta: { fontFamily: FONT, fontSize: ms(13.5), color: palette.textMuted, marginTop: 2 },
  payBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: ms(16), paddingVertical: ms(11), marginLeft: 8, boxShadow: NEU.primary },
  payText: { fontFamily: FONT, color: '#fff', fontWeight: '700', fontSize: ms(14.5) },

  qaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  qaLabel: { fontFamily: FONT, fontSize: ms(11), fontWeight: '600', color: palette.navy, textAlign: 'center', marginTop: 8, width: QA + QA_GAP, marginHorizontal: -QA_GAP / 2 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: SVC_GAP },
  svcLabel: { fontFamily: FONT, fontSize: ms(13), fontWeight: '600', color: palette.navy, textAlign: 'center', marginTop: 8 },

  sos: {
    flexDirection: 'row', alignItems: 'center', marginTop: 10, borderRadius: 999, paddingLeft: 16, paddingRight: 6, paddingVertical: 6,
    backgroundColor: '#FBE8EC', boxShadow: NEU.raisedSm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)',
  },
  siren: { width: ms(40), height: ms(40) },
  sosText: { flex: 1, fontFamily: FONT, color: '#C62828', fontWeight: '800', fontSize: ms(16), marginLeft: 10 },
  sosBtn: { width: ms(64), height: ms(64), borderRadius: ms(32), backgroundColor: '#E53935', alignItems: 'center', justifyContent: 'center', boxShadow: NEU.danger, borderWidth: 3, borderColor: '#FFD4D4' },
  sosBtnText: { fontFamily: FONT, color: '#fff', fontWeight: '800', fontSize: ms(17) },
});
