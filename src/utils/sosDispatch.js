// Pure helpers for SOS alert dispatch (Module 31).

export function mapsLink(loc) {
  if (loc && loc.lat != null && loc.lng != null) {
    return `https://maps.google.com/?q=${loc.lat},${loc.lng}`;
  }
  return null;
}

export function sosMessage(userName, loc) {
  const link = mapsLink(loc);
  const who = userName || 'A Yamuna Infra resident';
  const where = link
    ? `My live location: ${link}`
    : 'Live location unavailable — please call me immediately.';
  return `🆘 EMERGENCY — ${who} needs help right now. ${where}`;
}

// Normalise an Indian mobile to E.164 digits for wa.me (10-digit → +91).
export function toE164(phone) {
  const num = String(phone || '').replace(/\D/g, '');
  if (num.length === 10) return `91${num}`;
  return num;
}

export function whatsappLink(phone, message) {
  return `https://wa.me/${toE164(phone)}?text=${encodeURIComponent(message)}`;
}

export function smsLink(phone, message) {
  return `sms:${phone}?body=${encodeURIComponent(message)}`;
}
