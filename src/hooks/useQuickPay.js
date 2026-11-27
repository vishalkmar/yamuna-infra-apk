import React, { useRef, useState } from 'react';
import CashfreeCheckout from '../components/CashfreeCheckout';
import { paymentApi } from '../api/paymentApi';
import { showToast } from '../utils/toastConfig';

// Take an online (Cashfree) payment right after a booking is created.
//
//   const pay = useQuickPay();
//   … after booking: pay.start({ purpose: 'service', amount, refId, remarks, onDone: paid => … })
//   … render {pay.element} next to the screen/sheet.
//
// The booking is already saved; if the resident cancels or the gateway is
// unreachable they can still pay later, so failures are warnings, not errors.
export default function useQuickPay() {
  const [order, setOrder] = useState(null);
  const [open, setOpen] = useState(false);
  // `active` hides the booking sheet; the checkout opens a moment later so
  // the sheet's modal has fully gone (otherwise Android can hide the checkout
  // behind it or drop it altogether).
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const done = useRef(null);

  const start = async ({ purpose, amount, refId, remarks, items, onDone }) => {
    done.current = onDone;
    if (!(Number(amount) > 0)) { onDone?.(false); return false; }
    setStarting(true);
    try {
      const ord = await paymentApi.checkout({ purpose, amount: Number(amount), refId, remarks, items });
      setOrder(ord);
      setActive(true);
      setTimeout(() => setOpen(true), 350);
      return true;
    } catch (e) {
      showToast('warning', 'Booked — pay later', 'Online payment could not start. You can pay at the counter.');
      onDone?.(false);
      return false;
    } finally {
      setStarting(false);
    }
  };

  // Always verify with the server — the WebView return alone proves nothing.
  const finish = async verify => {
    setOpen(false);
    let paid = false;
    if (verify && order?.orderId) {
      try { paid = (await paymentApi.verifyCheckout(order.orderId))?.status === 'paid'; } catch (e) { paid = false; }
    }
    showToast(
      paid ? 'success' : 'warning',
      paid ? 'Payment received ✓' : 'Booking saved — payment pending',
      paid ? `Ref ${order?.orderId}` : 'No money was taken. You can pay later.',
    );
    const cb = done.current;
    done.current = null;
    cb?.(paid);
    // Only now let the owner sheet show again (the callback normally closes it).
    setActive(false);
  };

  const element = (
    <CashfreeCheckout
      visible={open}
      order={order}
      onClose={() => finish(true)}
      onSuccess={() => finish(true)}
      onCancel={() => finish(false)}
    />
  );

  return { start, element, starting, active };
}
