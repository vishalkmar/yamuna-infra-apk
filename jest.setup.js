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

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
