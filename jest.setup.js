// Mocks for native-only modules so Jest can render the app tree in node.

jest.mock('react-native-gesture-handler', () => ({}));

jest.mock('react-native-reanimated', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return { default: { View }, View };
});

jest.mock('react-native-webview', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return { WebView: View, default: View };
});

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: () => null,
  show: jest.fn(),
  hide: jest.fn(),
}));

// In-memory AsyncStorage. v3 dropped the old `jest/async-storage-mock` entry
// point and its `exports` map blocks deep-importing the new one, so the mock
// lives here — without it every test that touches the persisted store throws.
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();
  const mock = {
    getItem: jest.fn(async k => (store.has(k) ? store.get(k) : null)),
    setItem: jest.fn(async (k, v) => { store.set(k, v); }),
    removeItem: jest.fn(async k => { store.delete(k); }),
    clear: jest.fn(async () => { store.clear(); }),
    getAllKeys: jest.fn(async () => [...store.keys()]),
    multiGet: jest.fn(async ks => ks.map(k => [k, store.has(k) ? store.get(k) : null])),
    multiSet: jest.fn(async pairs => { pairs.forEach(([k, v]) => store.set(k, v)); }),
    multiRemove: jest.fn(async ks => { ks.forEach(k => store.delete(k)); }),
    mergeItem: jest.fn(async (k, v) => { store.set(k, v); }),
  };
  return { __esModule: true, default: mock, ...mock };
});
