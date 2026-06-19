import React from 'react';
import { View, Text, StyleSheet, Modal, Image, TouchableOpacity, ScrollView } from 'react-native';
import { palette, radius, spacing, typography } from '../theme';
import { formatINR } from '../utils/format';

// Full detail view for a food item — opens when a menu card is tapped. Shows
// the admin-entered description, image and details, with add-to-cart controls.
export default function FoodItemDetailSheet({ item, qty = 0, onClose, onAdd, onInc, onDec }) {
  if (!item) return null;
  return (
    <Modal visible={!!item} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handleRow}>
            <View style={styles.handle} />
            <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}><Text style={styles.close}>×</Text></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {item.image ? <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" /> : null}

            <View style={styles.rowTop}>
              <Text style={styles.veg}>{item.veg ? '🟢' : '🔴'}</Text>
              <Text style={styles.name}>{item.name}</Text>
            </View>
            {item.rating ? <Text style={styles.rating}>★ {item.rating}</Text> : null}

            {item.description ? (
              <Text style={styles.desc}>{item.description}</Text>
            ) : <Text style={[styles.desc, { fontStyle: 'italic', color: palette.textMuted }]}>No description added.</Text>}

            {/* Any extra detail fields the admin set */}
            <View style={styles.metaWrap}>
              {item.category ? <Meta label="Category" value={item.category} /> : null}
              {item.prepTime ? <Meta label="Prep time" value={`${item.prepTime} min`} /> : null}
              {item.serves ? <Meta label="Serves" value={item.serves} /> : null}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.price}>{formatINR(item.price)}</Text>
            {qty === 0 ? (
              <TouchableOpacity style={styles.addBtn} onPress={() => onAdd(item)}>
                <Text style={styles.addText}>ADD +</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.stepper}>
                <TouchableOpacity style={styles.stepBtn} onPress={() => onDec(item.id)}><Text style={styles.stepSign}>−</Text></TouchableOpacity>
                <Text style={styles.qty}>{qty}</Text>
                <TouchableOpacity style={styles.stepBtn} onPress={() => onInc(item.id)}><Text style={styles.stepSign}>+</Text></TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Meta({ label, value }) {
  return (
    <View style={styles.meta}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: palette.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: spacing.xl, maxHeight: '90%' },
  handleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: palette.divider },
  closeBtn: { position: 'absolute', right: 0, top: -4 },
  close: { fontSize: 26, color: palette.textMuted },

  image: { width: '100%', height: 200, borderRadius: radius.md, backgroundColor: palette.surfaceAlt, marginBottom: spacing.md },
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  veg: { fontSize: 12, marginRight: 6 },
  name: { ...typography.h2, flex: 1 },
  rating: { fontSize: 13, fontWeight: '700', color: palette.accent, marginTop: 2 },
  desc: { fontSize: 14, color: palette.text, lineHeight: 21, marginTop: spacing.sm },

  metaWrap: { marginTop: spacing.md },
  meta: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: palette.divider },
  metaLabel: { fontSize: 13, color: palette.textMuted },
  metaValue: { fontSize: 13, color: palette.text, fontWeight: '600' },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: palette.divider },
  price: { fontSize: 20, fontWeight: '900', color: palette.text },
  addBtn: { borderWidth: 1, borderColor: palette.primary, borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: 10, backgroundColor: '#EEF2FF' },
  addText: { color: palette.primary, fontWeight: '800', fontSize: 14 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: palette.primary, borderRadius: radius.md, overflow: 'hidden' },
  stepBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#EEF2FF' },
  stepSign: { color: palette.primary, fontWeight: '900', fontSize: 18 },
  qty: { minWidth: 32, textAlign: 'center', fontWeight: '800', color: palette.text, fontSize: 15 },
});
