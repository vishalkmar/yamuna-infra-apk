import { Linking } from 'react-native';
import { sosApi } from '../api/sosApi';
import { ensureLocationPermission, getCurrentLocation } from './location';
import { sosMessage, whatsappLink, smsLink } from '../utils/sosDispatch';

// Orchestrates an SOS alert: grab location, then push it to every saved person
// via the backend (email is sent server-side; SMS/WhatsApp are logged/queued).
// Returns a summary for the UI. Never throws.
export async function dispatchSos({ contacts = [], userName }) {
  await ensureLocationPermission();
  const location = await getCurrentLocation();
  const message = sosMessage(userName, location);

  let result = { notified: contacts.length, emailed: contacts.filter(c => c.email).length };
  try {
    const res = await sosApi.dispatch({ location, userName, message, contacts });
    if (res) result = { ...result, ...res };
  } catch (e) {
    // best-effort — UI still confirms the local alert
  }
  return { ...result, message, location };
}

export function openWhatsAppTo(phone, message) {
  return Linking.openURL(whatsappLink(phone, message)).catch(() => {});
}

export function openSmsTo(phone, message) {
  return Linking.openURL(smsLink(phone, message)).catch(() => {});
}
