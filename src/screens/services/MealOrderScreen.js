import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import CartBar from '../../components/CartBar';
import MealOrderSheet from '../../components/MealOrderSheet';
import { palette, radius, spacing, typography } from '../../theme';
import { formatINR, formatDate } from '../../utils/format';
import { loadFoodCategories, loadFoodOrders } from '../../store/slices/foodSlice';

export default function MealOrderScreen({ navigation }) {
  const dispatch = useDispatch();
  const { categories, categoriesLoading, orders, ordersLoading } = useSelector(s => s.food);
  const [tiffinOpen, setTiffinOpen] = useState(false);

  const reload = useCallback(() => {
    dispatch(loadFoodCategories());
    dispatch(loadFoodOrders());
  }, [dispatch]);

  useEffect(() => { reload(); }, [reload]);

  const openCategory = c =>
    navigation.navigate('FoodCategory', { categoryCode: c.code, categoryName: c.name });

  return (
    <View style={styles.flex}>
      <ScreenContainer refreshing={categoriesLoading || ordersLoading} onRefresh={reload}>
        <Card style={styles.hero}>
          <Text style={styles.heroTitle}>🍽️ Vrindavan Kitchen</Text>
          <Text style={styles.heroSub}>Satvik, Jain & regular veg food — order fresh, delivered hot.</Text>
          <TouchableOpacity style={styles.tiffinBtn} onPress={() => setTiffinOpen(true)}>
            <Text style={styles.tiffinText}>📅  Monthly tiffin plans →</Text>
          </TouchableOpacity>
        </Card>

        {/* Category grid */}
        <Text style={[typography.h3, styles.sectionTitle]}>What are you craving?</Text>
        {categoriesLoading && categories.length === 0 ? (
          <><CardSkeleton /><CardSkeleton /></>
        ) : (
          <View style={styles.grid}>
            {categories.map(c => (
              <TouchableOpacity key={c.code} style={styles.tile} activeOpacity={0.8} onPress={() => openCategory(c)}>
                <Image source={{ uri: c.image }} style={styles.tileImage} />
                <View style={styles.tileBody}>
                  <Text style={styles.tileName}>{c.icon} {c.name}</Text>
                  <Text style={styles.tileMeta}>{c.itemCount} items ›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* My food orders */}
        <Text style={[typography.h3, styles.sectionTitle]}>My orders</Text>
        {orders.length === 0 ? (
          <EmptyState icon="🧾" message="No food orders yet. Pick a category to start." />
        ) : orders.map(o => (
          <Card key={o.id} style={styles.orderCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.orderName}>{o.itemCount} items · {formatINR(o.total)}</Text>
              <StatusChip label={String(o.status).toUpperCase()} variant="info" />
            </View>
            <Text style={typography.caption} numberOfLines={1}>
              {o.items.map(i => `${i.name} ×${i.qty}`).join(', ')}
            </Text>
            <Text style={styles.orderCode}>{o.code} · {formatDate(o.placedAt)}</Text>
          </Card>
        ))}
      </ScreenContainer>

      <CartBar onPress={() => navigation.navigate('FoodCart')} />
      <MealOrderSheet visible={tiffinOpen} onClose={() => setTiffinOpen(false)} onDone={() => setTiffinOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { backgroundColor: palette.primary, borderColor: palette.primary, marginBottom: spacing.md },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  heroSub: { color: '#DBE3FF', fontSize: 13, marginTop: 6, lineHeight: 19 },
  tiffinBtn: { marginTop: spacing.md, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.md, paddingVertical: 10, alignItems: 'center' },
  tiffinText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  sectionTitle: { marginBottom: spacing.sm, marginTop: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: { width: '48%', backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.divider, overflow: 'hidden', marginBottom: spacing.sm },
  tileImage: { width: '100%', height: 96, backgroundColor: palette.surfaceAlt },
  tileBody: { padding: spacing.sm },
  tileName: { fontSize: 14, fontWeight: '700', color: palette.text },
  tileMeta: { fontSize: 12, color: palette.primary, fontWeight: '600', marginTop: 2 },

  orderCard: { marginBottom: spacing.sm },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  orderName: { fontSize: 14, fontWeight: '700', color: palette.text },
  orderCode: { fontSize: 11, color: palette.textMuted, marginTop: 4, letterSpacing: 0.3 },
});
