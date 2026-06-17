import { Platform, PermissionsAndroid } from 'react-native';

// Guarded wrapper around @react-native-community/geolocation (native module).
// Lazy-required so the JS never crashes if the native side isn't linked yet
// (e.g. before an APK rebuild) — getCurrentLocation just resolves null.
function lib() {
  try {
    return require('@react-native-community/geolocation').default;
  } catch (e) {
    return null;
  }
}

export async function ensureLocationPermission() {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location for SOS',
        message: 'Allow location so we can share where you are with your emergency contacts.',
        buttonPositive: 'Allow',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (e) {
    return false;
  }
}

// Resolves { lat, lng, accuracy } or null (never rejects).
export function getCurrentLocation() {
  const Geo = lib();
  return new Promise(resolve => {
    if (!Geo) { resolve(null); return; }
    try {
      Geo.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
      );
    } catch (e) {
      resolve(null);
    }
  });
}
