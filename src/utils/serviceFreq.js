// Mirror of server/src/utils/services.js frequency helpers so screens can
// label bookings and flag recurring (subscription) services inline.

const FREQUENCIES = ['one_time', 'daily', 'weekly', 'monthly'];

const FREQUENCY_LABEL = {
  one_time: 'One-time',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export function isRecurring(frequency) {
  return FREQUENCIES.includes(frequency) && frequency !== 'one_time';
}

export function frequencyLabel(frequency) {
  return FREQUENCY_LABEL[frequency] || frequency;
}
