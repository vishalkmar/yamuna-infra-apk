export const formatINR = (amount, withDecimals = false) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: withDecimals ? 2 : 0,
  }).format(amount);
};

export const formatDate = (input, opts = { day: '2-digit', month: 'short', year: 'numeric' }) => {
  if (!input) return '';
  const d = new Date(input);
  if (isNaN(d.getTime())) return String(input);
  return d.toLocaleDateString('en-IN', opts);
};

export const daysUntil = dateStr => {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
};
