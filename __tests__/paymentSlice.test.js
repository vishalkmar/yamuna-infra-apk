jest.mock('../src/api/paymentApi', () => ({ paymentApi: {} }));

import reducer, {
  setHistoryFilters, resetPay,
  loadSchedule, loadHistory, loadLedger,
  initiatePayment, verifyPayment,
} from '../src/store/slices/paymentSlice';

const initial = {
  schedule: null,
  history: [],
  ledger: null,
  loading: false,
  historyLoading: false,
  ledgerLoading: false,
  error: null,
  historyFilters: { search: '', method: '' },
  pay: { order: null, busy: false, error: null, lastReceipt: null },
};

describe('paymentSlice', () => {
  it('starts in the expected initial state', () => {
    expect(reducer(undefined, { type: 'init' })).toEqual(initial);
  });

  it('setHistoryFilters merges values', () => {
    const s = reducer(initial, setHistoryFilters({ search: 'plinth' }));
    expect(s.historyFilters).toEqual({ search: 'plinth', method: '' });
    const s2 = reducer(s, setHistoryFilters({ method: 'UPI' }));
    expect(s2.historyFilters).toEqual({ search: 'plinth', method: 'UPI' });
  });

  it('loadSchedule.fulfilled stores schedule', () => {
    const payload = { nextDue: { id: 4 }, installments: [{ id: 1 }], outstanding: 8500000, pendingCount: 5 };
    const s = reducer(initial, { type: loadSchedule.fulfilled.type, payload });
    expect(s.loading).toBe(false);
    expect(s.schedule.outstanding).toBe(8500000);
  });

  it('loadHistory.fulfilled stores history', () => {
    const payload = [{ id: 1, txnId: 'X' }, { id: 2, txnId: 'Y' }];
    const s = reducer(initial, { type: loadHistory.fulfilled.type, payload });
    expect(s.history).toHaveLength(2);
  });

  it('loadLedger.fulfilled stores ledger', () => {
    const payload = { summary: { totalAgreementValue: 1e7 } };
    const s = reducer(initial, { type: loadLedger.fulfilled.type, payload });
    expect(s.ledger.summary.totalAgreementValue).toBe(1e7);
  });

  it('initiatePayment lifecycle: pending → fulfilled', () => {
    const p1 = reducer(initial, { type: initiatePayment.pending.type });
    expect(p1.pay.busy).toBe(true);
    expect(p1.pay.error).toBeNull();

    const p2 = reducer(p1, {
      type: initiatePayment.fulfilled.type,
      payload: { orderId: 'O1', paymentLink: 'https://l', amount: 1000 },
    });
    expect(p2.pay.busy).toBe(false);
    expect(p2.pay.order.orderId).toBe('O1');
  });

  it('initiatePayment.rejected sets error', () => {
    const s = reducer(initial, {
      type: initiatePayment.rejected.type,
      payload: 'gateway down',
    });
    expect(s.pay.busy).toBe(false);
    expect(s.pay.error).toBe('gateway down');
  });

  it('verifyPayment.fulfilled stores receipt', () => {
    const s = reducer(initial, {
      type: verifyPayment.fulfilled.type,
      payload: { paymentId: 7, receiptCode: 'RCPT-1', status: 'paid' },
    });
    expect(s.pay.lastReceipt).toEqual({ paymentId: 7, receiptCode: 'RCPT-1', status: 'paid' });
  });

  it('resetPay clears pay sub-state', () => {
    const dirty = {
      ...initial,
      pay: { order: { orderId: 'X' }, busy: true, error: 'err', lastReceipt: { paymentId: 1 } },
    };
    const s = reducer(dirty, resetPay());
    expect(s.pay).toEqual(initial.pay);
  });
});
