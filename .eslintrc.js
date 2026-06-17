module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['server/node_modules/**'],
  overrides: [
    {
      files: ['__tests__/**/*.js', '**/*.test.js', 'jest.setup.js'],
      env: { jest: true, node: true },
    },
    {
      files: ['server/**/*.js'],
      env: { node: true, jest: true },
      rules: {
        'react-native/no-inline-styles': 'off',
      },
    },
  ],
};
