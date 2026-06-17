import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import CashfreeCheckout from '../../components/CashfreeCheckout';
import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusChip from '../../components/StatusChip';
import Input from '../../components/Input';
import RadioGroup from '../../components/RadioGroup';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import { palette, radius, spacing, typography } from '../../theme';
import { formatINR, formatDate, daysUntil } from '../../utils/format';
import { paymentSchema } from '../../utils/validation';
import {
  loadSchedule, loadHistory, loadLedger,
  initiatePayment, verifyPayment,
  setHistoryFilters, resetPay,
} from '../../store/slices/paymentSlice';
import { showToast } from '../../utils/toastConfig';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'history',  label: 'History' },
  { key: 'ledger',   label: 'Ledger' },
];

const STATUS_VARIANT = {
  paid:     'success',
  due:      'warning',
  overdue:  'error',
  upcoming: 'neutral',
};

const PAYMENT_METHODS = [
  { value: 'cashfree',   label: 'Cashfree (UPI / Cards / NetBanking)' },
  { value: 'upi',        label: 'UPI direct' },
  { value: 'netbanking', label: 'NetBanking' },
];

export default function PaymentDashboardScreen() {
  const dispatch = useDispatch();
  const { schedule, history, ledger, loading, historyLoading, ledgerLoading,
          historyFilters, pay } = useSelector(s => s.payment);
  const user = useSelector(s => s.auth.user);
  const bookingId = user?.bookingId || user?.primary_booking_id || 'BK-2024-00421';

  const [tab, setTab] = useState('upcoming');
  const [payTarget, setPayTarget] = useState(null);     // installment selected for paying
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const reloadSchedule = useCallback(() => dispatch(loadSchedule(bookingId)), [dispatch, bookingId]);
  const reloadHistory = useCallback(
    () => dispatch(loadHistory({ bookingId, ...historyFilters })),
    [dispatch, bookingId, historyFilters],
  );
  const reloadLedger = useCallback(() => dispatch(loadLedger(bookingId)), [dispatch, bookingId]);

  useEffect(() => { reloadSchedule(); }, [reloadSchedule]);
  useEffect(() => { if (tab === 'history') reloadHistory(); }, [tab, reloadHistory]);
  useEffect(() => { if (tab === 'ledger' && !ledger) reloadLedger(); }, [tab, ledger, reloadLedger]);

  const nextDue = schedule?.nextDue;

  const startPay = inst => {
    setPayTarget(inst);
    dispatch(resetPay());
  };
  const closePaySheet = () => {
    setPayTarget(null);
    dispatch(resetPay());
  };
  const openCheckout = () => setCheckoutOpen(true);
  const closeCheckout = () => setCheckoutOpen(false);

  return (
    <ScreenContainer refreshing={loading} onRefresh={reloadSchedule}>
      {/* Sticky header */}
      {loading && !schedule ? (
        <CardSkeleton />
      ) : nextDue ? (
        <DueHeroCard nextDue={nextDue} outstanding={schedule?.outstanding} onPay={() => startPay(nextDue)} />
      ) : (
        <Card>
          <Text style={typography.h3}>🎉 No dues!</Text>
          <Text style={[typography.bodyMuted, { marginTop: 6 }]}>
            You're all paid up. Future installments will appear here.
          </Text>
        </Card>
      )}

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tab, tab === t.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'upcoming' && (
        <UpcomingTab schedule={schedule} loading={loading} onPay={startPay} />
      )}

      {tab === 'history' && (
        <HistoryTab
          history={history}
          loading={historyLoading}
          filters={historyFilters}
          onSearch={s => dispatch(setHistoryFilters({ search: s }))}
          onMethod={m => dispatch(setHistoryFilters({ method: m }))}
        />
      )}

      {tab === 'ledger' && (
        <LedgerTab ledger={ledger} loading={ledgerLoading} />
      )}

      {/* Pay-now sheet */}
      <PayNowSheet
        visible={!!payTarget}
        installment={payTarget}
        bookingId={bookingId}
        pay={pay}
        onClose={closePaySheet}
        onOpenCheckout={openCheckout}
      />

      {/* Cashfree WebView */}
      <CashfreeCheckout
        visible={checkoutOpen}
        order={pay.order}
        onClose={closeCheckout}
        onSuccess={async () => {
          closeCheckout();
          try {
            const result = await dispatch(verifyPayment({ orderId: pay.order.orderId })).unwrap();
            if (result.status === 'paid') {
              showToast(
                'success',
                'Payment received',
                `Receipt #${result.receiptCode} sent to email & WhatsApp.`,
              );
              closePaySheet();
              reloadSchedule();
              if (tab === 'history') reloadHistory();
              if (tab === 'ledger')  reloadLedger();
            } else {
              showToast('warning', 'Still processing', 'We are confirming the payment with your bank.');
            }
          } catch (e) {
            showToast('error', 'Verification failed', String(e));
          }
        }}
        onCancel={() => {
          closeCheckout();
          showToast('warning', 'Payment cancelled', 'You can try again any time.');
        }}
      />
    </ScreenContainer>
  );
}

// =========================================================================
//                                Hero card
// =========================================================================

function DueHeroCard({ nextDue, outstanding, onPay }) {
  const dueDate = nextDue.dueDate;
  const days = daysUntil(dueDate);
  const isOverdue = nextDue.status === 'overdue' || (days !== null && days < 0);
  const totalDue = Number(nextDue.amount) + Number(nextDue.lateFee || 0);

  return (
    <Card style={[styles.hero, isOverdue && styles.heroOverdue]}>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={typography.caption}>NEXT INSTALLMENT</Text>
          <Text style={styles.heroAmount}>{formatINR(totalDue)}</Text>
          <Text style={typography.bodyMuted}>{nextDue.label}</Text>
          {Number(nextDue.lateFee) > 0 ? (
            <Text style={styles.lateFee}>
              Includes ₹{Number(nextDue.lateFee).toLocaleString('en-IN')} late fee
            </Text>
          ) : null}
        </View>
        <StatusChip
          label={
            isOverdue
              ? `${Math.abs(days)}d OVERDUE`
              : days === 0 ? 'DUE TODAY' : `${days}d LEFT`
          }
          variant={isOverdue ? 'error' : days <= 7 ? 'warning' : 'info'}
        />
      </View>
      <Text style={styles.dueDate}>Due on {formatDate(dueDate)}</Text>
      {outstanding ? (
        <Text style={styles.outstanding}>
          Total outstanding: <Text style={{ fontWeight: '700' }}>{formatINR(outstanding)}</Text>
        </Text>
      ) : null}
      <Button title={`Pay ${formatINR(totalDue)}`} onPress={onPay} style={{ marginTop: spacing.md }} />
    </Card>
  );
}

// =========================================================================
//                            Tab: Upcoming
// =========================================================================

function UpcomingTab({ schedule, loading, onPay }) {
  const [filter, setFilter] = useState('all');
  const filters = ['all', 'due', 'overdue', 'upcoming', 'paid'];

  if (loading && !schedule) {
    return <><CardSkeleton /><CardSkeleton /></>;
  }
  if (!schedule?.installments?.length) {
    return <EmptyState icon="📅" title="No schedule" message="Your installment schedule will appear here." />;
  }

  const visible = filter === 'all'
    ? schedule.installments
    : schedule.installments.filter(i => i.status === filter);

  return (
    <>
      <FlatList
        horizontal
        data={filters}
        keyExtractor={f => f}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.sm }}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f[0].toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        )}
      />
      <FlatList
        data={visible}
        keyExtractor={i => String(i.id)}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={<EmptyState icon="🔍" message={`No "${filter}" installments.`} />}
        renderItem={({ item }) => <InstallmentRow item={item} onPay={onPay} />}
      />
    </>
  );
}

function InstallmentRow({ item, onPay }) {
  const totalDue = Number(item.amount) + Number(item.lateFee || 0);
  const canPay = item.status === 'due' || item.status === 'overdue';
  return (
    <Card padded>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1, paddingRight: spacing.md }}>
          <Text style={styles.rowTitle}>{item.label}</Text>
          <Text style={typography.caption}>Due {formatDate(item.dueDate)}</Text>
          {Number(item.lateFee) > 0 ? (
            <Text style={styles.lateFeeSmall}>+ ₹{Number(item.lateFee).toLocaleString('en-IN')} late fee</Text>
          ) : null}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.rowAmount}>{formatINR(totalDue)}</Text>
          <StatusChip label={item.status.toUpperCase()} variant={STATUS_VARIANT[item.status]} />
          {canPay ? (
            <TouchableOpacity style={styles.payBtn} onPress={() => onPay(item)}>
              <Text style={styles.payBtnText}>Pay</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

// =========================================================================
//                            Tab: History
// =========================================================================

function HistoryTab({ history, loading, filters, onSearch, onMethod }) {
  const methods = ['', 'UPI', 'NetBanking', 'Cashfree'];

  return (
    <>
      <Input
        placeholder="Search txn id, remarks…"
        value={filters.search}
        onChangeText={onSearch}
      />
      <FlatList
        horizontal
        data={methods}
        keyExtractor={m => m || 'all'}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.sm }}
        renderItem={({ item: m }) => (
          <TouchableOpacity
            style={[styles.filterChip, filters.method === m && styles.filterChipActive]}
            onPress={() => onMethod(m)}
          >
            <Text style={[styles.filterChipText, filters.method === m && styles.filterChipTextActive]}>
              {m || 'All methods'}
            </Text>
          </TouchableOpacity>
        )}
      />
      {loading ? (
        <><CardSkeleton /><CardSkeleton /></>
      ) : history.length === 0 ? (
        <EmptyState icon="📒" title="No transactions" message="Payments will show up here." />
      ) : (
        <FlatList
          data={history}
          keyExtractor={p => String(p.id)}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => <PaymentRow item={item} />}
        />
      )}
    </>
  );
}

function PaymentRow({ item }) {
  return (
    <Card padded>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1, paddingRight: spacing.md }}>
          <Text style={styles.rowTitle}>{item.installmentLabel || item.remarks || 'Payment'}</Text>
          <Text style={typography.caption}>
            {item.txnId} · {formatDate(item.date)} · {item.method}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.rowAmount}>{formatINR(item.amount)}</Text>
          <StatusChip label={item.status.toUpperCase()} variant="success" />
        </View>
      </View>
    </Card>
  );
}

// =========================================================================
//                            Tab: Ledger
// =========================================================================

function LedgerTab({ ledger, loading }) {
  if (loading || !ledger) return <CardSkeleton />;
  const s = ledger.summary;
  return (
    <>
      <Card style={{ marginBottom: spacing.md }}>
        <Text style={typography.caption}>AGREEMENT VALUE</Text>
        <Text style={styles.ledgerBig}>{formatINR(s.totalAgreementValue)}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${s.progressPct}%` }]} />
        </View>
        <View style={[styles.rowBetween, { marginTop: spacing.md }]}>
          <View>
            <Text style={typography.caption}>PAID</Text>
            <Text style={styles.ledgerSub}>{formatINR(s.totalPaid)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={typography.caption}>OUTSTANDING</Text>
            <Text style={[styles.ledgerSub, { color: palette.error }]}>{formatINR(s.outstanding)}</Text>
          </View>
        </View>
        <Button
          title="Download Statement (PDF)"
          variant="outline"
          style={{ marginTop: spacing.md }}
          onPress={() => showToast('success', 'Downloaded', 'Statement saved to your device.')}
        />
      </Card>

      <Text style={[typography.h3, { marginBottom: spacing.sm }]}>Payments</Text>
      <FlatList
        data={ledger.payments}
        keyExtractor={p => String(p.id)}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={<EmptyState icon="💸" message="No payments yet." />}
        renderItem={({ item }) => <PaymentRow item={{ ...item, date: item.paidAt }} />}
      />
    </>
  );
}

// =========================================================================
//                            Pay Now sheet
// =========================================================================

function PayNowSheet({ visible, installment, bookingId, pay, onClose, onOpenCheckout }) {
  const dispatch = useDispatch();
  const totalDue = installment
    ? Number(installment.amount) + Number(installment.lateFee || 0)
    : 0;

  const { control, handleSubmit, watch, formState: { errors }, reset } = useForm({
    resolver: yupResolver(paymentSchema),
    defaultValues: {
      amount: '',
      paymentMode: 'cashfree',
      upiId: '',
      remarks: '',
      consent: false,
    },
  });

  // Reset form whenever sheet opens for a new installment
  useEffect(() => {
    if (installment) {
      reset({
        amount: String(totalDue),
        paymentMode: 'cashfree',
        upiId: '',
        remarks: installment.label,
        consent: false,
      });
    }
  }, [installment, totalDue, reset]);

  const mode = watch('paymentMode');
  const consent = watch('consent');

  const submit = async data => {
    try {
      await dispatch(
        initiatePayment({
          bookingId,
          installmentId: installment.id,
          amount: Number(data.amount),
          mode: data.paymentMode,
          remarks: data.remarks,
        }),
      ).unwrap();
      onOpenCheckout();
    } catch (e) {
      showToast('error', 'Cannot start payment', String(e));
    }
  };

  if (!installment) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={typography.h2}>Pay Installment</Text>
              <Text style={typography.caption}>{installment.label}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Text style={{ fontSize: 22, color: palette.textMuted }}>×</Text>
            </TouchableOpacity>
          </View>

          <Controller
            control={control}
            name="amount"
            render={({ field: { value, onChange } }) => (
              <Input
                label={`Amount (max ${formatINR(totalDue)})`}
                placeholder="0"
                keyboardType="numeric"
                value={String(value)}
                onChangeText={onChange}
                error={errors.amount?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="paymentMode"
            render={({ field: { value, onChange } }) => (
              <RadioGroup
                label="Payment Mode"
                value={value}
                onChange={onChange}
                direction="column"
                options={PAYMENT_METHODS}
                error={errors.paymentMode?.message}
              />
            )}
          />

          {mode === 'upi' ? (
            <Controller
              control={control}
              name="upiId"
              render={({ field: { value, onChange } }) => (
                <Input
                  label="UPI ID"
                  placeholder="yourname@upi"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="none"
                  error={errors.upiId?.message}
                />
              )}
            />
          ) : null}

          <Controller
            control={control}
            name="remarks"
            render={({ field: { value, onChange } }) => (
              <Input
                label="Remarks"
                placeholder="Add a note"
                value={value}
                onChangeText={onChange}
                maxLength={200}
              />
            )}
          />

          <Controller
            control={control}
            name="consent"
            render={({ field: { value, onChange } }) => (
              <TouchableOpacity
                style={styles.consentRow}
                onPress={() => onChange(!value)}
                activeOpacity={0.85}
              >
                <View style={[styles.checkbox, value && styles.checkboxChecked]}>
                  {value ? <Text style={{ color: '#fff', fontSize: 13 }}>✓</Text> : null}
                </View>
                <Text style={styles.consentText}>
                  I agree to the payment terms & conditions.
                </Text>
              </TouchableOpacity>
            )}
          />
          {errors.consent ? <Text style={styles.errorText}>{errors.consent.message}</Text> : null}

          <Button
            title={pay.busy ? 'Starting…' : 'Continue to Cashfree'}
            onPress={handleSubmit(submit)}
            disabled={!consent || pay.busy}
            loading={pay.busy}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </View>
    </Modal>
  );
}

// =========================================================================
//                                  Styles
// =========================================================================

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },

  hero: { marginBottom: spacing.md },
  heroOverdue: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  heroAmount: { fontSize: 26, fontWeight: '800', color: palette.text, marginVertical: 2 },
  lateFee: { ...typography.caption, color: palette.error, marginTop: 2, fontWeight: '600' },
  dueDate: { ...typography.caption, marginTop: spacing.sm },
  outstanding: { ...typography.caption, marginTop: 4, color: palette.textMuted },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.md - 2 },
  tabActive: { backgroundColor: palette.surface },
  tabText: { fontSize: 12, fontWeight: '600', color: palette.textMuted },
  tabTextActive: { color: palette.primary },

  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: radius.pill, borderWidth: 1,
    borderColor: palette.border, backgroundColor: palette.surface,
    marginRight: 8,
  },
  filterChipActive: { borderColor: palette.primary, backgroundColor: '#EEF2FF' },
  filterChipText: { fontSize: 12, color: palette.textMuted, fontWeight: '600' },
  filterChipTextActive: { color: palette.primary },

  rowTitle: { fontSize: 14, fontWeight: '600', color: palette.text },
  rowAmount: { fontSize: 15, fontWeight: '700', color: palette.text, marginBottom: 4 },
  lateFeeSmall: { fontSize: 11, color: palette.error, marginTop: 4, fontWeight: '600' },
  payBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: palette.primary,
  },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  ledgerBig: { fontSize: 24, fontWeight: '800', color: palette.text, marginVertical: 4 },
  ledgerSub: { fontSize: 16, fontWeight: '700', color: palette.text, marginTop: 2 },
  progressBar: {
    height: 8, borderRadius: 4,
    backgroundColor: palette.surfaceAlt,
    marginTop: spacing.md, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: palette.success },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: palette.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '92%',
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },

  consentRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  checkbox: {
    width: 22, height: 22, borderRadius: 5,
    borderWidth: 1.5, borderColor: palette.border,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.sm,
    backgroundColor: palette.surface,
  },
  checkboxChecked: { backgroundColor: palette.primary, borderColor: palette.primary },
  consentText: { fontSize: 13, color: palette.text, flex: 1 },
  errorText: { color: palette.error, fontSize: 12, marginTop: 4 },
});
