import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { palette, radius, spacing } from '../theme';
import { formatINR } from '../utils/format';
import { cartCount, cartTotal } from '../utils/cart';

// Sticky bottom bar shown across the food screens whenever the cart has items.
export default function CartBar({ onPress, label = 'View cart' }) {
  const cart = useSelector(s => s.food.cart);
  const count = cartCount(cart);
  if (count === 0) return null;

  return (
    <TouchableOpacity style={styles.bar} activeOpacity={0.85} onPress={onPress}>
      <Text style={styles.left}>{count} {count === 1 ? 'item' : 'items'} · {formatINR(cartTotal(cart))}</Text>
      <Text style={styles.right}>{label} →</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.lg,
    backgroundColor: palette.primary, borderRadius: radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: 14,
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  left: { color: '#fff', fontWeight: '700', fontSize: 14 },
  right: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
