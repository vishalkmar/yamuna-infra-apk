import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import CartBar from '../../components/CartBar';
import { palette, radius, spacing, typography } from '../../theme';
import { formatINR } from '../../utils/format';
import { qtyOf } from '../../utils/cart';
import { loadFoodItems, addToCart, incItem, decItem } from '../../store/slices/foodSlice';

export default function FoodCategoryScreen({ route, navigation }) {
  const { categoryCode, categoryName } = route.params || {};
  const dispatch = useDispatch();
  const { items, itemsLoading, cart } = useSelector(s => s.food);

  const reload = useCallback(() => { dispatch(loadFoodItems(categoryCode)); }, [dispatch, categoryCode]);
  useEffect(() => { reload(); }, [reload]);

  return (
    <View style={styles.flex}>
      <ScreenContainer refreshing={itemsLoading} onRefresh={reload}>
        <Text style={[typography.h3, styles.title]}>{categoryName || 'Menu'}</Text>

        {itemsLoading && items.length === 0 ? (
          <><CardSkeleton /><CardSkeleton /></>
        ) : items.length === 0 ? (
          <EmptyState icon="🍽️" message="No items in this category yet." />
        ) : items.map(item => {
          const qty = qtyOf(cart, item.id);
          return (
            <Card key={item.id} style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <View style={styles.info}>
                <View style={styles.rowTop}>
                  <Text style={styles.vegDot}>{item.veg ? '🟢' : '🔴'}</Text>
                  <Text style={styles.name}>{item.name}</Text>
                </View>
                <Text style={styles.rating}>★ {item.rating}</Text>
                <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
                <View style={styles.rowBetween}>
                  <Text style={styles.price}>{formatINR(item.price)}</Text>
                  {qty === 0 ? (
                    <TouchableOpacity style={styles.addBtn} onPress={() => dispatch(addToCart(item))}>
                      <Text style={styles.addText}>ADD +</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.stepper}>
                      <TouchableOpacity style={styles.stepBtn} onPress={() => dispatch(decItem(item.id))}><Text style={styles.stepSign}>−</Text></TouchableOpacity>
                      <Text style={styles.qty}>{qty}</Text>
                      <TouchableOpacity style={styles.stepBtn} onPress={() => dispatch(incItem(item.id))}><Text style={styles.stepSign}>+</Text></TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          );
        })}
      </ScreenContainer>

      <CartBar onPress={() => navigation.navigate('FoodCart')} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { marginBottom: spacing.sm },
  card: { flexDirection: 'row', marginBottom: spacing.sm, padding: spacing.sm },
  image: { width: 92, height: 92, borderRadius: radius.md, backgroundColor: palette.surfaceAlt },
  info: { flex: 1, marginLeft: spacing.md },
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  vegDot: { fontSize: 10, marginRight: 6 },
  name: { fontSize: 15, fontWeight: '700', color: palette.text, flex: 1 },
  rating: { fontSize: 12, fontWeight: '700', color: palette.accent, marginTop: 2 },
  desc: { fontSize: 12, color: palette.textMuted, marginTop: 2, lineHeight: 16 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  price: { fontSize: 15, fontWeight: '800', color: palette.text },
  addBtn: { borderWidth: 1, borderColor: palette.primary, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 6, backgroundColor: '#EEF2FF' },
  addText: { color: palette.primary, fontWeight: '800', fontSize: 13 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: palette.primary, borderRadius: radius.md, overflow: 'hidden' },
  stepBtn: { paddingHorizontal: 12, paddingVertical: 5, backgroundColor: '#EEF2FF' },
  stepSign: { color: palette.primary, fontWeight: '900', fontSize: 16 },
  qty: { minWidth: 28, textAlign: 'center', fontWeight: '800', color: palette.text },
});
