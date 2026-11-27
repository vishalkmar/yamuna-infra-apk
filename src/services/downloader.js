import { NativeModules, PermissionsAndroid, Platform, Linking } from 'react-native';
import Toast from 'react-native-toast-message';

// Save a file (PDF docket / statement / receipt) straight into the phone's
// Downloads/YamunaInfra folder via Android's DownloadManager. The system shows
// a progress + "Download complete" notification; tapping it (or our toast)
// opens the file in any PDF viewer.
const native = NativeModules.YIDownloader;

const withDl = url => (/[?&]dl=1/.test(url) ? url : `${url}${url.includes('?') ? '&' : '?'}dl=1`);

async function ensureLegacyPermission() {
  // Android 10+ writes to Downloads without any permission.
  if (Platform.OS !== 'android' || Platform.Version >= 29) return true;
  const r = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE, {
    title: 'Allow saving files',
    message: 'Yamuna Infra needs storage access to save your documents to Downloads.',
    buttonPositive: 'Allow',
  });
  return r === PermissionsAndroid.RESULTS.GRANTED;
}

function fileNameFor(title, url) {
  const fromUrl = decodeURIComponent(String(url).split('?')[0].split('/').pop() || '');
  const base = (title || fromUrl || 'document').replace(/\.pdf$/i, '').replace(/[^A-Za-z0-9 _-]+/g, ' ').trim().slice(0, 70) || 'document';
  return `${base}.pdf`;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function downloadFile(url, title) {
  if (!url) return false;
  const target = withDl(url);
  if (!native || Platform.OS !== 'android') {
    // Fallback (e.g. an older APK without the native module): hand the
    // download link to the system, which saves it as a file.
    await Linking.openURL(target).catch(() => {});
    return true;
  }
  if (!(await ensureLegacyPermission())) {
    Toast.show({ type: 'error', text1: 'Permission needed', text2: 'Allow storage access to save the file.' });
    return false;
  }
  const name = fileNameFor(title, url);
  try {
    const id = await native.download(target, name, title || name);
    Toast.show({ type: 'info', text1: 'Downloading…', text2: `${name} → Downloads/YamunaInfra` });
    // Wait (up to ~60s) for it to finish, then offer to open it.
    for (let i = 0; i < 60; i++) {
      await sleep(1000);
      const s = await native.status(id);
      if (s === 'done') {
        Toast.show({
          type: 'success', text1: 'Downloaded ✓', text2: `Saved to Downloads/YamunaInfra · tap to open`,
          visibilityTime: 6000, onPress: () => { Toast.hide(); native.open(id); },
        });
        return true;
      }
      if (s === 'failed') break;
    }
    Toast.show({ type: 'error', text1: 'Download failed', text2: 'Please check your internet and try again.' });
    return false;
  } catch (e) {
    Toast.show({ type: 'error', text1: 'Download failed', text2: e?.message || 'Please try again.' });
    return false;
  }
}
