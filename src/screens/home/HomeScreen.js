import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useSelector } from 'react-redux';
import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import StatusChip from '../../components/StatusChip';
import SectionHeader from '../../components/SectionHeader';
import { palette, radius, spacing, typography } from '../../theme';
import { formatINR, formatDate, daysUntil } from '../../utils/format';

const QUICK_TILES = [
  { key: 'BookingDocket', label: 'Booking\nDocket', icon: '📘', color: '#EEF2FF' },
  { key: 'PaymentDashboard', label: 'Payments', icon: '💳', color: '#F0FDF4' },
  { key: 'ConstructionTracker', label: 'Progress', icon: '🏗️', color: '#FEF3C7' },
  { key: 'DocumentRepository', label: 'Documents', icon: '📄', color: '#DBEAFE' },
  { key: 'SiteVisit', label: 'Site Visit', icon: '🗺️', color: '#FFE4E6' },
  { key: 'Support', label: 'Support', icon: '🎧', color: '#F3E8FF' },
];

// These screens live in other tabs' stacks, so navigate to the tab first,
// then the nested screen (cross-navigator navigation).
const SERVICE_TILES = [
  { key: 'HomeServices', tab: 'ResidentTab', label: 'Cleaning', icon: '🧹' },
  { key: 'HealthcareScreen', tab: 'ResidentTab', label: 'Healthcare', icon: '🩺' },
  { key: 'WellnessScreen', tab: 'ResidentTab', label: 'Wellness', icon: '🧘' },
  { key: 'TempleDirectoryScreen', tab: 'ResidentTab', label: 'Temples', icon: '🛕' },
  { key: 'AmenityBookingScreen', tab: 'CommunityTab', label: 'Clubhouse', icon: '🎯' },
  { key: 'VisitorScreen', tab: 'CommunityTab', label: 'Visitors', icon: '🧑‍🤝‍🧑' },
];

export default function HomeScreen({ navigation }) {
  const user = useSelector(s => s.auth.user);

  // Mock summary — production: from /booking + /payment endpoints
  const summary = {
    unit: 'T2-B-1204',
    project: 'Vrindavan Heights',
    nextDueAmount: 1250000,
    nextDueDate: '2026-06-25',
    progressPct: 62,
  };
  const due = daysUntil(summary.nextDueDate);

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

      <Card style={styles.heroCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={styles.heroLabel}>YOUR UNIT</Text>
            <Text style={styles.heroUnit}>{summary.unit}</Text>
            <Text style={styles.heroProject}>{summary.project}</Text>
          </View>
          <StatusChip label="ACTIVE" variant="success" />
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${summary.progressPct}%` }]} />
        </View>
        <Text style={styles.progressLabel}>
          Construction progress: <Text style={{ fontWeight: '700' }}>{summary.progressPct}%</Text>
        </Text>
      </Card>

      <Card style={styles.dueCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={typography.caption}>NEXT DUE</Text>
            <Text style={styles.dueAmount}>{formatINR(summary.nextDueAmount)}</Text>
            <Text style={typography.bodyMuted}>
              {formatDate(summary.nextDueDate)} · {due >= 0 ? `${due} days left` : `${Math.abs(due)} days overdue`}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.payBtn}
            onPress={() => navigation.navigate('PaymentDashboard')}
          >
            <Text style={styles.payBtnText}>Pay Now</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <SectionHeader title="Quick Access" />
      <FlatList
        data={QUICK_TILES}
        keyExtractor={i => i.key}
        numColumns={3}
        scrollEnabled={false}
        columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: spacing.sm }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.tile, { backgroundColor: item.color }]}
            onPress={() => navigation.navigate(item.key)}
          >
            <Text style={styles.tileIcon}>{item.icon}</Text>
            <Text style={styles.tileLabel}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      <SectionHeader title="Resident Services" subtitle="Lifestyle, health, spiritual & community" />
      <FlatList
        data={SERVICE_TILES}
        keyExtractor={i => i.key}
        numColumns={3}
        scrollEnabled={false}
        columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: spacing.sm }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.tile, { backgroundColor: palette.surface }]}
            onPress={() => navigation.navigate(item.tab, { screen: item.key })}
          >
            <Text style={styles.tileIcon}>{item.icon}</Text>
            <Text style={styles.tileLabel}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

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

  tile: {
    width: '31.5%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.divider,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  tileIcon: { fontSize: 28 },
  tileLabel: { fontSize: 11, fontWeight: '600', color: palette.text, marginTop: 6, textAlign: 'center' },

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
