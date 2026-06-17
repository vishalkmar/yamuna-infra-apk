import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import Button from './Button';
import Dropdown from './Dropdown';
import { palette, spacing, typography } from '../theme';
import { savePreferences } from '../store/slices/profileSlice';
import { showToast } from '../utils/toastConfig';
import { LANGUAGE_LABEL, DIETARY_LABEL } from '../utils/profile';

const LANGUAGES = Object.entries(LANGUAGE_LABEL).map(([value, label]) => ({ value, label }));
const DIETS = Object.entries(DIETARY_LABEL).map(([value, label]) => ({ value, label }));
const CHANNELS = [
  { key: 'push', label: 'Push notifications' },
  { key: 'sms', label: 'SMS' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'email', label: 'Email' },
];

const defaults = (p = {}) => ({
  language: p.language || 'en',
  dietary: p.dietary || 'veg',
  channels: { push: true, sms: true, whatsapp: true, email: false, ...(p.channels || {}) },
  festivalAlerts: p.festivalAlerts !== false,
});

export default function PreferencesSheet({ visible, onClose, onSaved }) {
  const dispatch = useDispatch();
  const { preferences, saveBusy } = useSelector(s => s.profile);
  const [form, setForm] = useState(defaults(preferences || {}));

  useEffect(() => { if (visible) setForm(defaults(preferences || {})); }, [visible, preferences]);

  const setChannel = (key, val) => setForm(f => ({ ...f, channels: { ...f.channels, [key]: val } }));

  const submit = async () => {
    try {
      await dispatch(savePreferences(form)).unwrap();
      showToast('success', 'Saved', 'Preferences updated.');
      onSaved?.();
      onClose();
    } catch (e) {
      showToast('error', 'Could not save', String(e));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={typography.h2}>Preferences</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}><Text style={styles.close}>×</Text></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Dropdown label="App language" value={form.language} options={LANGUAGES} onChange={v => setForm(f => ({ ...f, language: v }))} />
            <Dropdown label="Dietary preference" value={form.dietary} options={DIETS} onChange={v => setForm(f => ({ ...f, dietary: v }))} />

            <Text style={styles.group}>How should we reach you?</Text>
            {CHANNELS.map(c => (
              <View key={c.key} style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>{c.label}</Text>
                <Switch
                  value={!!form.channels[c.key]}
                  onValueChange={v => setChannel(c.key, v)}
                  trackColor={{ true: palette.primary, false: palette.border }}
                  thumbColor="#fff"
                />
              </View>
            ))}

            <View style={[styles.toggleRow, { marginTop: spacing.sm }]}>
              <Text style={styles.toggleLabel}>Festival & temple alerts</Text>
              <Switch
                value={!!form.festivalAlerts}
                onValueChange={v => setForm(f => ({ ...f, festivalAlerts: v }))}
                trackColor={{ true: palette.primary, false: palette.border }}
                thumbColor="#fff"
              />
            </View>

            <Button title={saveBusy ? 'Saving…' : 'Save Preferences'} onPress={submit} loading={saveBusy} style={{ marginTop: spacing.lg }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: palette.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: spacing.xxl, maxHeight: '92%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  close: { fontSize: 26, color: palette.textMuted },
  group: { ...typography.label, color: palette.primary, marginBottom: spacing.sm, marginTop: spacing.md },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  toggleLabel: { fontSize: 14, color: palette.text, flex: 1 },
});
