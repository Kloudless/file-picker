// eslint configurations that only apply to test/ts/

module.exports = {
  extends: [
    '../../.eslintrc.js',
  ],
  globals: {
    Kloudless: "readonly",
  },
  rules: {
    '@typescript-eslint/camelcase': 'off',
    // disable import/named to avoid un-expected errors that actually work
    // fine with typescript
    'import/named': 'off',
  },
};
