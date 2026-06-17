jest.mock('../src/api/foodApi', () => ({ foodApi: {} }));

import reducer, {
  addToCart, incItem, decItem, removeItem, clearCart,
  loadFoodCategories, loadFoodItems, placeFoodOrder,
} from '../src/store/slices/foodSlice';

const base = () => reducer(undefined, { type: 'init' });
const item = { id: 101, name: 'Poha', price: 60, image: 'x' };

describe('foodSlice cart', () => {
  it('addToCart adds then increments qty', () => {
    let s = reducer(base(), addToCart(item));
    expect(s.cart).toHaveLength(1);
    expect(s.cart[0]).toMatchObject({ itemId: 101, qty: 1, price: 60 });
    s = reducer(s, addToCart(item));
    expect(s.cart[0].qty).toBe(2);
  });

  it('incItem / decItem adjust qty, decItem removes at 0', () => {
    let s = reducer(base(), addToCart(item));
    s = reducer(s, incItem(101));
    expect(s.cart[0].qty).toBe(2);
    s = reducer(s, decItem(101));
    expect(s.cart[0].qty).toBe(1);
    s = reducer(s, decItem(101));
    expect(s.cart).toHaveLength(0);
  });

  it('removeItem and clearCart empty the cart', () => {
    let s = reducer(base(), addToCart(item));
    s = reducer(s, addToCart({ id: 102, name: 'Dosa', price: 100 }));
    s = reducer(s, removeItem(101));
    expect(s.cart).toHaveLength(1);
    s = reducer(s, clearCart());
    expect(s.cart).toEqual([]);
  });

  it('placeFoodOrder.fulfilled clears the cart', () => {
    let s = reducer(base(), addToCart(item));
    s = reducer(s, { type: placeFoodOrder.pending.type });
    expect(s.placing).toBe(true);
    s = reducer(s, { type: placeFoodOrder.fulfilled.type, payload: { id: 1 } });
    expect(s.placing).toBe(false);
    expect(s.cart).toEqual([]);
  });

  it('loadFoodCategories / loadFoodItems store data', () => {
    let s = reducer(base(), { type: loadFoodCategories.fulfilled.type, payload: [{ code: 'breakfast' }] });
    expect(s.categories).toHaveLength(1);
    s = reducer(s, { type: loadFoodItems.fulfilled.type, payload: [{ id: 1 }, { id: 2 }] });
    expect(s.items).toHaveLength(2);
  });
});
