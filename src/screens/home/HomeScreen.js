import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import StatusChip from '../../components/StatusChip';
import SectionHeader from '../../components/SectionHeader';
import { palette, radius, spacing, typography } from '../../theme';
import { formatINR, formatDate, daysUntil } from '../../utils/format';
import { loadMyProperties, loadProgress } from '../../store/slices/projectSlice';
import { loadMyProperties as loadPayProperties, loadSchedule as loadPaySchedule } from '../../store/slices/paymentSlice';

// Grid columns sized to the screen so incomplete rows stay left-aligned.
// The -1 buffer avoids sub-pixel overflow that would wrap the last column.
const GRID_GAP = 10;
const SCREEN_W = Dimensions.get('window').width;
const colWidth = n => Math.floor((SCREEN_W - spacing.lg * 2 - GRID_GAP * (n - 1)) / n) - 1;
const QUICK_W = colWidth(3);
const SVC_W = colWidth(4);

const QUICK_TILES = [
  { key: 'BookingDocket', label: 'Booking\nDocket', icon: '📘', tint: '#E8EEFF' },
  { key: 'PaymentDashboard', label: 'Payments', icon: '💳', tint: '#E4F6EC' },
  { key: 'ConstructionTracker', label: 'Progress', icon: '🏗️', tint: '#FFF0D6' },
  { key: 'SiteVisit', label: 'Site\nOverview', icon: '🗺️', tint: '#FCE4E8' },
  { key: 'Support', label: 'Support', icon: '🎧', tint: '#EDE7FF' },
  { key: 'ProfileTab', label: 'Profile', icon: '👤', tint: '#E6F4FB' },
];

// Every resident service, navigating into the Services tab's stack.
const SERVICE_TILES = [
  { key: 'HomeServices', label: 'Cleaning', icon: '🧹', tint: '#E8EEFF' },
  { key: 'Housekeeping', label: 'Housekeeping', icon: '🧺', tint: '#FFF0D6' },
  { key: 'CookBooking', label: 'Book a Cook', icon: '👨‍🍳', tint: '#FCE4E8' },
  { key: 'MealOrder', label: 'Meal Tiffin', icon: '🍱', tint: '#E4F6EC' },
  { key: 'HealthcareScreen', label: 'Healthcare', icon: '🩺', tint: '#E6F4FB' },
  { key: 'Wheelchair', label: 'Mobility Aid', icon: '🦽', tint: '#EDE7FF' },
  { key: 'WellnessScreen', label: 'Wellness', icon: '🧘', tint: '#FFF0D6' },
  { key: 'SpiritualScreen', label: 'Spiritual', icon: '🕉️', tint: '#FCE4E8' },
  { key: 'TempleDirectoryScreen', label: 'Temples', icon: '🛕', tint: '#E8EEFF' },
  { key: 'Darshan', label: 'Darshan', icon: '🚕', tint: '#E4F6EC' },
];

function GridTile({ item, width, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.8} style={[styles.tile, { width }]} onPress={onPress}>
      <View style={[styles.iconBadge, { backgroundColor: item.tint }]}>
        <Text style={styles.tileIcon}>{item.icon}</Text>
      </View>
      <Text style={styles.tileLabel} numberOfLines={2}>{item.label}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);
  const { property, properties, selectedPropertyId, progressPct } = useSelector(s => s.project);
  const paySchedule = useSelector(s => s.payment.schedule);
  const paySelectedId = useSelector(s => s.payment.selectedPropertyId);

  // Load the resident's property + its construction progress for the hero card.
  useEffect(() => { dispatch(loadMyProperties()); dispatch(loadPayProperties()); }, [dispatch]);
  useEffect(() => {
    if (selectedPropertyId) dispatch(loadProgress(selectedPropertyId));
  }, [dispatch, selectedPropertyId]);
  useEffect(() => {
    if (paySelectedId) dispatch(loadPaySchedule(paySelectedId));
  }, [dispatch, paySelectedId]);

  const unitLabel = property?.flatNo
    ? [property.tower && `Tower ${property.tower}`, property.flatNo].filter(Boolean).join('-')
    : (property?.label || (properties[0]?.flatNo) || '—');
  const projectName = property?.projectName || properties[0]?.projectName || 'Your residence';
  const hasProperty = properties.length > 0;

  // Next due comes from the real payment plan.
  const nextDue = paySchedule?.nextDue || null;

  return (
    <ScreenContainer>
      <View style={styles.greetingRow}>
        <View style={{ flex: 1 }}>
          <Text style={typography.caption}>Welcome back,</Text>
          <Text style={typography.h2}>{user?.name || 'Customer'} 👋</Text>
        </View>
        <TouchableOpacity
          style={styles.bell}
          onPress={() => navigation.navigate('NotificationsScreen')}
        >
          <Text style={{ fontSize: 20 }}>🔔</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('ConstructionTracker')}>
        <Card style={styles.heroCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={styles.heroLabel}>YOUR UNIT</Text>
              <Text style={styles.heroUnit}>{unitLabel}</Text>
              <Text style={styles.heroProject}>{projectName}</Text>
            </View>
            <StatusChip
              label={property?.workStatus === 'completed' ? 'COMPLETED' : 'ACTIVE'}
              variant={property?.workStatus === 'completed' ? 'info' : 'success'}
            />
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${hasProperty ? progressPct : 0}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            {hasProperty
              ? <>Construction progress: <Text style={{ fontWeight: '700' }}>{progressPct}%</Text></>
              : 'No property linked yet'}
          </Text>
        </Card>
      </TouchableOpacity>

      <Card style={styles.dueCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={typography.caption}>NEXT DUE</Text>
            {nextDue ? (
              <>
                <Text style={styles.dueAmount}>{formatINR(Number(nextDue.amount) + Number(nextDue.lateFee || 0))}</Text>
                <Text style={typography.bodyMuted}>
                  {nextDue.label} · {formatDate(nextDue.dueDate)}
                  {nextDue.dueDate ? ` · ${daysUntil(nextDue.dueDate) >= 0 ? `${daysUntil(nextDue.dueDate)} days left` : `${Math.abs(daysUntil(nextDue.dueDate))} days overdue`}` : ''}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.dueAmount}>—</Text>
                <Text style={typography.bodyMuted}>No dues pending</Text>
              </>
            )}
          </View>
          <TouchableOpacity
            style={styles.payBtn}
            onPress={() => navigation.navigate('PaymentDashboard')}
          >
            <Text style={styles.payBtnText}>{nextDue ? 'Pay Now' : 'View'}</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <SectionHeader title="Quick Access" />
      <View style={styles.grid}>
        {QUICK_TILES.map(item => (
          <GridTile key={item.key} item={item} width={QUICK_W} onPress={() => navigation.navigate(item.key)} />
        ))}
      </View>

      <SectionHeader title="Resident Services" subtitle="Lifestyle, health, spiritual & community" />
      <View style={styles.grid}>
        {SERVICE_TILES.map(item => (
          <GridTile
            key={item.key}
            item={item}
            width={SVC_W}
            onPress={() => navigation.navigate('ResidentTab', { screen: item.key })}
          />
        ))}
      </View>

      <TouchableOpacity
        style={styles.sos}
        onPress={() => navigation.navigate('SOSScreen')}
      >
        <Text style={styles.sosText}>🚨  Emergency SOS — Hold to Activate</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bell: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: palette.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: palette.divider,
  },
  heroCard: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
    marginBottom: spacing.md,
  },
  heroLabel: { color: '#A8B2D4', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  heroUnit: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 2 },
  heroProject: { color: '#DBE3FF', fontSize: 13, marginTop: 2 },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: palette.accent },
  progressLabel: { color: '#DBE3FF', fontSize: 12, marginTop: 8 },

  dueCard: { marginBottom: spacing.md },
  dueAmount: { fontSize: 22, fontWeight: '800', color: palette.text, marginTop: 2 },
  payBtn: {
    backgroundColor: palette.primary,
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: radius.md,
    alignSelf: 'center',
  },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  tile: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  iconBadge: {
    width: 54, height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  tileIcon: { fontSize: 26 },
  tileLabel: { fontSize: 11.5, fontWeight: '600', color: palette.text, textAlign: 'center', lineHeight: 15 },

  sos: {
    marginTop: spacing.lg,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sosText: { color: '#B91C1C', fontWeight: '700', fontSize: 14 },
});
