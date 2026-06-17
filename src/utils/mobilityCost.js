// Mirror of server/src/utils/mobility.js cost logic so the booking sheet can
// show a live total before submitting.

export const ATTENDANT_FEE_PER_DAY = 300;

export function computeTotal(aid, { mode = 'rent', days = 1, withAttendant = false } = {}) {
  if (!aid) return 0;
  if (mode === 'buy') return Number(aid.buyPrice) || 0;
  const d = Math.max(1, Number(days) || 1);
  const rent = (Number(aid.rentPerDay) || 0) * d;
  const attendant = withAttendant ? ATTENDANT_FEE_PER_DAY * d : 0;
  return rent + attendant;
}
