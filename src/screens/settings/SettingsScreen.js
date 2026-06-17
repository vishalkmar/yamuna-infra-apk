import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Linking, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import Dropdown from '../../components/Dropdown';
import { palette, spacing, typography } from '../../theme';
import { LANGUAGE_LABEL } from '../../utils/profile';
import { loadSettings, saveSettings } from '../../store/slices/settingsSlice';

const pkg = require('../../../package.json');

const LANGUAGES = Object.entries(LANGUAGE_LABEL).map(([value, label]) => ({ value, label }));
const NOTIF_TYPES = [
  { key: 'announcements', label: 'Community announcements' },
  { key: 'payments', label: 'Payments & dues' },
  { key: 'services', label: 'Service updates' },
  { key: 'reminders', label: 'Reminders' },
];
const TERMS_URL = 'https://yamunainfra.example.com/terms';
const PRIVACY_URL = 'https://yamunainfra.example.com/privacy';

function ToggleRow({ label, value, onValueChange, disabled }) {
  return (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={!!value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ true: palette.primary, false: palette.border }}
        thumbColor="#fff"
      />
    </View>
  );
}

function LinkRow({ label, value, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.6 : 1}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const dispatch = useDispatch();
  const { language, notifications, privacy, loading } = useSelector(s => s.settings);

  const reload = useCallback(() => { dispatch(loadSettings()); }, [dispatch]);
  useEffect(() => { reload(); }, [reload]);

  const patch = payload => dispatch(saveSettings(payload));
  const setNotif = (key, val) => patch({ notifications: { [key]: val } });
  const setPrivacy = (key, val) => patch({ privacy: { [key]: val } });

  const openSystemSettings = () => {
    Linking.openSettings().catch(() => {});
  };
  const openUrl = url => Linking.openURL(url).catch(() => {});

  const masterOff = !notifications?.master;

  return (
    <ScreenContainer refreshing={loading} onRefresh={reload}>
      {/* Language */}
      <Text style={[typography.h3, styles.section]}>Language</Text>
      <Card style={styles.card}>
        <Dropdown label="App language" value={language} options={LANGUAGES} onChange={v => patch({ language: v })} />
        <Text style={typography.caption}>Affects labels across the app. (हिन्दी rollout in progress.)</Text>
      </Card>

      {/* Notifications */}
      <Text style={[typography.h3, styles.section]}>Notifications</Text>
      <Card padded={false} style={styles.card}>
        <View style={styles.padded}>
          <ToggleRow label="All notifications" value={notifications?.master} onValueChange={v => setNotif('master', v)} />
          <View style={styles.divider} />
          {NOTIF_TYPES.map(t => (
            <ToggleRow key={t.key} label={t.label} value={notifications?.[t.key]} onValueChange={v => setNotif(t.key, v)} disabled={masterOff} />
          ))}
        </View>
      </Card>

      {/* Privacy */}
      <Text style={[typography.h3, styles.section]}>Privacy</Text>
      <Card padded={false} style={styles.card}>
        <View style={styles.padded}>
          <ToggleRow label="Show my profile to neighbours" value={privacy?.profileVisible} onValueChange={v => setPrivacy('profileVisible', v)} />
          <ToggleRow label="Share usage analytics" value={privacy?.analytics} onValueChange={v => setPrivacy('analytics', v)} />
          <ToggleRow label="Biometric app lock" value={privacy?.biometricLock} onValueChange={v => setPrivacy('biometricLock', v)} />
        </View>
      </Card>

      {/* Access / permissions */}
      <Text style={[typography.h3, styles.section]}>App access</Text>
      <Card padded={false} style={styles.card}>
        <View style={styles.padded}>
          <Text style={typography.caption}>Manage device permissions (notifications, location, contacts) in system settings.</Text>
          <TouchableOpacity style={styles.linkBtn} onPress={openSystemSettings}>
            <Text style={styles.linkBtnText}>Open {Platform.OS === 'ios' ? 'iOS' : 'Android'} settings ›</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* About */}
      <Text style={[typography.h3, styles.section]}>About</Text>
      <Card padded={false} style={styles.card}>
        <View style={styles.padded}>
          <LinkRow label="App version" value={`v${pkg.version}`} />
          <View style={styles.divider} />
          <LinkRow label="Terms of Service" value="›" onPress={() => openUrl(TERMS_URL)} />
          <LinkRow label="Privacy Policy" value="›" onPress={() => openUrl(PRIVACY_URL)} />
        </View>
      </Card>

      <View style={{ height: spacing.xl }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.md, marginBottom: spacing.sm },
  card: { marginBottom: spacing.sm },
  padded: { padding: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9 },
  rowDisabled: { opacity: 0.45 },
  rowLabel: { fontSize: 14, color: palette.text, flex: 1, marginRight: spacing.md },
  rowValue: { fontSize: 14, color: palette.textMuted, fontWeight: '600' },
  divider: { height: 1, backgroundColor: palette.divider, marginVertical: 6 },
  linkBtn: { marginTop: spacing.sm },
  linkBtnText: { color: palette.primary, fontWeight: '700', fontSize: 14 },
});
