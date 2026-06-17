import { mapsLink, sosMessage, toE164, whatsappLink, smsLink } from '../src/utils/sosDispatch';

describe('sosDispatch helpers', () => {
  it('mapsLink builds a maps URL or null', () => {
    expect(mapsLink({ lat: 27.58, lng: 77.7 })).toBe('https://maps.google.com/?q=27.58,77.7');
    expect(mapsLink(null)).toBeNull();
    expect(mapsLink({ lat: null, lng: null })).toBeNull();
  });

  it('sosMessage includes location link when present, fallback otherwise', () => {
    expect(sosMessage('Piyush', { lat: 1, lng: 2 })).toContain('https://maps.google.com/?q=1,2');
    expect(sosMessage('Piyush', { lat: 1, lng: 2 })).toContain('Piyush');
    expect(sosMessage(null, null)).toContain('A Yamuna Infra resident');
    expect(sosMessage('X', null)).toContain('unavailable');
  });

  it('toE164 prefixes 91 for 10-digit numbers', () => {
    expect(toE164('9876543210')).toBe('919876543210');
    expect(toE164('+91 98765 43210')).toBe('919876543210');
    expect(toE164('919876543210')).toBe('919876543210');
  });

  it('whatsappLink / smsLink encode the message', () => {
    const wa = whatsappLink('9876543210', 'help me');
    expect(wa).toBe('https://wa.me/919876543210?text=help%20me');
    expect(smsLink('9876543210', 'help me')).toBe('sms:9876543210?body=help%20me');
  });
});
