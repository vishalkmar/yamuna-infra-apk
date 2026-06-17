import { cartCount, cartTotal, qtyOf, deliveryFee, grandTotal, FREE_DELIVERY_OVER, DELIVERY_FEE } from '../src/utils/cart';

const cart = [
  { itemId: 1, price: 100, qty: 2 },
  { itemId: 2, price: 50, qty: 1 },
];

describe('cart helpers', () => {
  it('cartCount sums quantities', () => {
    expect(cartCount(cart)).toBe(3);
    expect(cartCount([])).toBe(0);
  });

  it('cartTotal sums price*qty', () => {
    expect(cartTotal(cart)).toBe(250);
    expect(cartTotal([])).toBe(0);
  });

  it('qtyOf returns qty for an item or 0', () => {
    expect(qtyOf(cart, 1)).toBe(2);
    expect(qtyOf(cart, 99)).toBe(0);
  });

  it('deliveryFee is free above threshold, flat below, 0 when empty', () => {
    expect(deliveryFee([])).toBe(0);
    expect(deliveryFee(cart)).toBe(DELIVERY_FEE); // 250 < 299
    expect(deliveryFee([{ itemId: 3, price: FREE_DELIVERY_OVER, qty: 1 }])).toBe(0);
  });

  it('grandTotal adds delivery fee', () => {
    expect(grandTotal(cart)).toBe(250 + DELIVERY_FEE);
    expect(grandTotal([{ itemId: 3, price: 400, qty: 1 }])).toBe(400);
  });
});
