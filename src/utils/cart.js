// Pure cart helpers for Food Ordering (Module 35).

export const cartCount = (cart = []) => cart.reduce((n, i) => n + (i.qty || 0), 0);

export const cartTotal = (cart = []) => cart.reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0);

export const qtyOf = (cart = [], itemId) => {
  const found = cart.find(i => i.itemId === itemId);
  return found ? found.qty : 0;
};

// Delivery is free above a threshold; small flat fee otherwise (0 when empty).
export const DELIVERY_FEE = 25;
export const FREE_DELIVERY_OVER = 299;

export const deliveryFee = (cart = []) => {
  const total = cartTotal(cart);
  if (total === 0 || total >= FREE_DELIVERY_OVER) return 0;
  return DELIVERY_FEE;
};

export const grandTotal = (cart = []) => cartTotal(cart) + deliveryFee(cart);
