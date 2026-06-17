module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!(?:.pnpm/)?((@react-native|react-native|react-native-.*|@react-navigation/.*|@reduxjs/.*|@hookform/.*|@tanstack/.*|redux-persist|immer)/))',
  ],
  setupFiles: ['./jest.setup.js'],
};
