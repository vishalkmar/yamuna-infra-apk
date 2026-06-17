import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import CashfreeCheckout from '../../components/CashfreeCheckout';
import { palette, radius, spacing, typography } from '../../theme';
import { formatINR } from '../../utils/format';
import { cartTotal, deliveryFee, grandTotal } from '../../utils/cart';
import { incItem, decItem, removeItem, placeFoodOrder } from '../../store/slices/foodSlice';
import { paymentApi } from '../../api/paymentApi';
import { showToast } from '../../utils/toastConfig';

export default function CartScreen({ navigation }) {
  const dispatch = useDispatch();
  const { cart, placing } = useSelector(s => s.food);

  const [order, setOrder] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  const sub = cartTotal(cart);
  const fee = deliveryFee(cart);
  const total = grandTotal(cart);

  const startPay = async () => {
    try {
      setPaying(true);
      const ord = await paymentApi.initiate({ foodOrder: true, amount: total, mode: 'cashfree', remarks: 'Food order' });
      setPaying(false);
      setOrder(ord);
      setCheckoutOpen(true);
    } catch (e) {
      setPaying(false);
      showToast('error', 'Cannot start payment', String(e));
    }
  };

  const onPaid = async () => {
    setCheckoutOpen(false);
    try { await paymentApi.verify(order?.orderId); } catch (e) { /* ignore */ }
    try {
      const placed = await dispatch(placeFoodOrder({ items: cart, total })).unwrap();
      showToast('success', 'Order placed', `${placed.code} · ${formatINR(placed.total)}. Preparing your food!`);
      navigation.goBack();
    } catch (e) {
      showToast('error', 'Order failed', String(e));
    }
  };

  const onCancel = () => {
    setCheckoutOpen(false);
    showToast('warning', 'Payment cancelled', 'Your cart is saved — try again any time.');
  };

  if (cart.length === 0) {
    return (
      <ScreenContainer>
        <EmptyState icon="🛒" title="Your cart is empty" message="Add some delicious food to get started." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <CashfreeCheckout visible={checkoutOpen} order={order} onClose={onCancel} onSuccess={onPaid} onCancel={onCancel} />

      <Text style={[typography.h3, styles.title]}>Your cart</Text>
      {cart.map(c => (
        <Card key={c.itemId} style={styles.row}>
          <Image source={{ uri: c.image }} style={styles.image} />
          <View style={styles.info}>
            <Text style={styles.name}>{c.name}</Text>
            <Text style={styles.price}>{formatINR(c.price)} × {c.qty} = {formatINR(c.price * c.qty)}</Text>
          </View>
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => dispatch(decItem(c.itemId))}><Text style={styles.stepSign}>−</Text></TouchableOpacity>
            <Text style={styles.qty}>{c.qty}</Text>
            <TouchableOpacity style={styles.stepBtn} onPress={() => dispatch(incItem(c.itemId))}><Text style={styles.stepSign}>+</Text></TouchableOpacity>
          </View>
        </Card>
      ))}

      <Card style={styles.summary}>
        <Row label="Item total" value={formatINR(sub)} />
        <Row label={fee === 0 ? 'Delivery (free)' : 'Delivery'} value={fee === 0 ? 'FREE' : formatINR(fee)} />
        <View style={styles.divider} />
        <Row label="To pay" value={formatINR(total)} strong />
        <TouchableOpacity onPress={() => cart.forEach(c => dispatch(removeItem(c.itemId)))}>
          <Text style={styles.clear}>Clear cart</Text>
        </TouchableOpacity>
      </Card>

      <Button
        title={paying || placing ? 'Please wait…' : `Pay ${formatINR(total)} & Place Order`}
        onPress={startPay}
        loading={paying || placing}
        style={{ marginTop: spacing.sm }}
      />
    </ScreenContainer>
  );
}

function Row({ label, value, strong }) {
  return (
    <View style={styles.sumRow}>
      <Text style={[styles.sumLabel, strong && styles.sumStrong]}>{label}</Text>
      <Text style={[styles.sumValue, strong && styles.sumStrong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, padding: spacing.sm },
  image: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: palette.surfaceAlt },
  info: { flex: 1, marginLeft: spacing.md },
  name: { fontSize: 14, fontWeight: '700', color: palette.text },
  price: { fontSize: 12, color: palette.textMuted, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: palette.primary, borderRadius: radius.md, overflow: 'hidden' },
  stepBtn: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#EEF2FF' },
  stepSign: { color: palette.primary, fontWeight: '900', fontSize: 16 },
  qty: { minWidth: 26, textAlign: 'center', fontWeight: '800', color: palette.text },

  summary: { marginTop: spacing.sm, marginBottom: spacing.sm },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  sumLabel: { fontSize: 13, color: palette.textMuted },
  sumValue: { fontSize: 13, color: palette.text, fontWeight: '600' },
  sumStrong: { fontSize: 15, fontWeight: '800', color: palette.text },
  divider: { height: 1, backgroundColor: palette.divider, marginVertical: 6 },
  clear: { color: palette.error, fontWeight: '700', fontSize: 12, marginTop: spacing.sm },
});
