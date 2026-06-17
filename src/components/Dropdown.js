import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { palette, radius, spacing, typography } from '../theme';

export default function Dropdown({ label, value, options = [], onChange, placeholder = 'Select…', error }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => (o.value ?? o) === value);
  const display = selected?.label ?? selected ?? '';

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.field, error && styles.fieldError]}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
      >
        <Text style={[styles.fieldText, !display && { color: palette.textMuted }]}>
          {display || placeholder}
        </Text>
        <Text style={styles.chev}>▼</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.err}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label || 'Choose one'}</Text>
            <FlatList
              data={options}
              keyExtractor={o => String(o.value ?? o)}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              renderItem={({ item }) => {
                const optVal = item.value ?? item;
                const optLabel = item.label ?? item;
                const active = optVal === value;
                return (
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => { onChange(optVal); setOpen(false); }}
                  >
                    <Text style={[styles.optionText, active && styles.optionActive]}>
                      {optLabel}
                    </Text>
                    {active ? <Text style={styles.tick}>✓</Text> : null}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
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
    borderWidth: 1, borderColor: palette.border, borderRadius: radius.md,
    backgroundColor: palette.surface,
  },
  fieldError: { borderColor: palette.error },
  fieldText: { fontSize: 15, color: palette.text },
  chev: { color: palette.textMuted, fontSize: 12 },
  err: { color: palette.error, fontSize: 12, marginTop: 4 },

  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', padding: spacing.lg },
  sheet: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing.md, maxHeight: '70%' },
  sheetTitle: { ...typography.h3, marginBottom: spacing.sm },
  option: { paddingVertical: 14, paddingHorizontal: spacing.sm, flexDirection: 'row', justifyContent: 'space-between' },
  optionText: { fontSize: 15, color: palette.text },
  optionActive: { color: palette.primary, fontWeight: '700' },
  tick: { color: palette.primary, fontWeight: '700' },
  sep: { height: 1, backgroundColor: palette.divider },
});
