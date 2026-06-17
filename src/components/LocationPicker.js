import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, FlatList } from 'react-native';

import { palette, radius, spacing, typography } from '../theme';
import { transportApi } from '../api/transportApi';
import { ensureLocationPermission, getCurrentLocation } from '../services/location';
import { showToast } from '../utils/toastConfig';

// Pickup / drop location field. Tapping opens a search modal over a curated
// Vrindavan place list (offline) + "Use current location" (device GPS).
// To switch to live Google Places, set a real ENV.GOOGLE_MAPS_KEY and back
// `transportApi.places` with the Places Autocomplete API.
export default function LocationPicker({ label, value, placeholder = 'Search location…', onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [locating, setLocating] = useState(false);

  const search = useCallback(async q => {
    try { setResults(await transportApi.places(q)); } catch (e) { setResults([]); }
  }, []);

  useEffect(() => { if (open) search(query); }, [open, query, search]);

  const pick = place => {
    onChange({ id: place.id, name: place.name, area: place.area, lat: place.lat, lng: place.lng });
    setOpen(false);
    setQuery('');
  };

  const useCurrent = async () => {
    setLocating(true);
    await ensureLocationPermission();
    const loc = await getCurrentLocation();
    setLocating(false);
    if (!loc) {
      showToast('warning', 'Location unavailable', 'Pick a location from the list instead.');
      return;
    }
    onChange({ id: 'current', name: 'Current location', area: 'Your GPS position', lat: loc.lat, lng: loc.lng });
    setOpen(false);
  };

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity style={styles.field} activeOpacity={0.8} onPress={() => setOpen(true)}>
        <Text style={[styles.fieldText, !value && styles.placeholder]} numberOfLines={1}>
          {value ? value.name : placeholder}
        </Text>
        <Text style={styles.pin}>📍</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={typography.h3}>{label || 'Choose location'}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={10}><Text style={styles.close}>×</Text></TouchableOpacity>
            </View>

            <TextInput
              style={styles.search}
              value={query}
              onChangeText={setQuery}
              placeholder="Search a place in Vrindavan / Mathura…"
              placeholderTextColor={palette.textMuted}
              autoFocus
            />

            <TouchableOpacity style={styles.currentRow} onPress={useCurrent} disabled={locating}>
              <Text style={styles.currentIcon}>🎯</Text>
              <Text style={styles.currentText}>{locating ? 'Locating…' : 'Use current location'}</Text>
            </TouchableOpacity>

            <FlatList
              data={results}
              keyExtractor={p => String(p.id)}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              ListEmptyComponent={<Text style={styles.empty}>No matching places.</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.option} onPress={() => pick(item)}>
                  <Text style={styles.optIcon}>{item.temple ? '🛕' : '📍'}</Text>
                  <View style={styles.flex1}>
                    <Text style={styles.optName}>{item.name}</Text>
                    <Text style={typography.caption}>{item.area}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: 6 },
  field: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: 12,
    borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, backgroundColor: palette.surface,
  },
  fieldText: { fontSize: 15, color: palette.text, flex: 1, marginRight: spacing.sm },
  placeholder: { color: palette.textMuted },
  pin: { fontSize: 16 },

  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: palette.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: spacing.xl, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  close: { fontSize: 26, color: palette.textMuted },
  search: {
    backgroundColor: palette.surface, borderRadius: radius.md, borderWidth: 1, borderColor: palette.border,
    paddingHorizontal: spacing.md, paddingVertical: 10, color: palette.text, fontSize: 15, marginBottom: spacing.sm,
  },
  currentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: spacing.sm },
  currentIcon: { fontSize: 18, marginRight: spacing.sm },
  currentText: { fontSize: 14, fontWeight: '700', color: palette.primary },
  sep: { height: 1, backgroundColor: palette.divider },
  empty: { ...typography.bodyMuted, textAlign: 'center', paddingVertical: spacing.lg },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: spacing.sm },
  optIcon: { fontSize: 18, marginRight: spacing.sm },
  optName: { fontSize: 15, fontWeight: '600', color: palette.text },
  flex1: { flex: 1 },
});
