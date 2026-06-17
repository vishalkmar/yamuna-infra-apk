// Mirror of server/src/utils/visitDate.js so the frontend can show inline
// errors before submitting.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(s) {
  if (!s || !ISO_DATE.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !isNaN(d.getTime());
}

export function dayOfWeek(isoDate) {
  return new Date(isoDate + 'T00:00:00Z').getUTCDay();
}

export function validateVisitDate(isoDate, { now = new Date() } = {}) {
  if (!isIsoDate(isoDate)) return { ok: false, reason: 'Invalid date format (use YYYY-MM-DD)' };
  const min = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  min.setUTCDate(min.getUTCDate() + 1);
  const target = new Date(isoDate + 'T00:00:00Z');
  if (target < min) return { ok: false, reason: 'Site visits must be booked at least 1 day in advance' };
  if (dayOfWeek(isoDate) === 0) return { ok: false, reason: 'Sundays are closed for site visits' };
  return { ok: true };
}

export function minBookableDate(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
