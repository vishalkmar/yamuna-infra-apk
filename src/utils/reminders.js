// Pure helpers for Reminders 2.0 (Module 29).
// Times are stored as 24h "HH:MM" and displayed as 12-hour AM/PM.
// Scheduling uses the device's LOCAL time — keep the phone on IST for Indian time.

export const REMINDER_CATEGORIES = [
  { value: 'medicine', label: 'Medicine', icon: '💊' },
  { value: 'payment', label: 'Payment / EMI', icon: '💳' },
  { value: 'service', label: 'Home service', icon: '🧹' },
  { value: 'darshan', label: 'Darshan / Temple', icon: '🛕' },
  { value: 'booking', label: 'Booking / Amenity', icon: '📅' },
  { value: 'other', label: 'Other', icon: '⏰' },
];

export const categoryMeta = value =>
  REMINDER_CATEGORIES.find(c => c.value === value) || REMINDER_CATEGORIES[REMINDER_CATEGORIES.length - 1];

// "HH:MM" (24h) -> { hour12, minute, period }
export function parse24(timeLabel) {
  const [hRaw, mRaw] = String(timeLabel || '').split(':');
  let hour = parseInt(hRaw, 10);
  let minute = parseInt(mRaw, 10);
  if (isNaN(hour)) hour = 8;
  if (isNaN(minute)) minute = 0;
  const period = hour >= 12 ? 'PM' : 'AM';
  let hour12 = hour % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute, period };
}

// { hour12, minute, period } -> "HH:MM" (24h)
export function to24(hour12, minute, period) {
  let h = Number(hour12) % 12;
  if (period === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${String(Number(minute) || 0).padStart(2, '0')}`;
}

// "HH:MM" (24h) -> "h:MM AM/PM"
export function to12hLabel(timeLabel) {
  const { hour12, minute, period } = parse24(timeLabel);
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
}

// Next occurrence (epoch ms) of HH:MM in LOCAL time, strictly in the future.
export function nextOccurrenceMs(timeLabel, now = new Date()) {
  const [hRaw, mRaw] = String(timeLabel || '08:00').split(':');
  let h = parseInt(hRaw, 10);
  let m = parseInt(mRaw, 10);
  if (isNaN(h)) h = 8;
  if (isNaN(m)) m = 0;
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  return d.getTime();
}
