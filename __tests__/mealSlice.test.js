jest.mock('../src/api/mealApi', () => ({ mealApi: {} }));

import reducer, {
  loadMenu, loadOrders, loadSubscriptions, placeOrder, subscribe,
} from '../src/store/slices/mealSlice';

const initial = {
  menu: [],
  menuDate: null,
  menuLoading: false,
  orders: [],
  ordersLoading: false,
  subscriptions: [],
  subsLoading: false,
  orderBusy: false,
  subscribeBusy: false,
  error: null,
};

describe('mealSlice', () => {
  it('starts in expected initial state', () => {
    expect(reducer(undefined, { type: 'init' })).toEqual(initial);
  });

  it('loadMenu.fulfilled stores items + date', () => {
    const payload = { date: '2026-06-11', items: [{ id: 1, mealType: 'lunch' }] };
    const s = reducer(initial, { type: loadMenu.fulfilled.type, payload });
    expect(s.menu).toHaveLength(1);
    expect(s.menuDate).toBe('2026-06-11');
    expect(s.menuLoading).toBe(false);
  });

  it('loadOrders + loadSubscriptions store their lists', () => {
    const s1 = reducer(initial, { type: loadOrders.fulfilled.type, payload: [{ id: 1 }] });
    expect(s1.orders).toHaveLength(1);
    const s2 = reducer(initial, { type: loadSubscriptions.fulfilled.type, payload: [{ id: 1 }, { id: 2 }] });
    expect(s2.subscriptions).toHaveLength(2);
  });

  it('placeOrder lifecycle toggles orderBusy', () => {
    const pend = reducer(initial, { type: placeOrder.pending.type });
    expect(pend.orderBusy).toBe(true);
    const done = reducer(pend, { type: placeOrder.fulfilled.type, payload: { id: 1 } });
    expect(done.orderBusy).toBe(false);
  });

  it('placeOrder.rejected stores error', () => {
    const s = reducer(initial, { type: placeOrder.rejected.type, payload: 'too soon' });
    expect(s.orderBusy).toBe(false);
    expect(s.error).toBe('too soon');
  });

  it('subscribe lifecycle toggles subscribeBusy', () => {
    const pend = reducer(initial, { type: subscribe.pending.type });
    expect(pend.subscribeBusy).toBe(true);
    const done = reducer(pend, { type: subscribe.fulfilled.type, payload: { id: 1 } });
    expect(done.subscribeBusy).toBe(false);
  });
});
