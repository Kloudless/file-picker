module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
  ],
  env: {
    jest: true,
  },
  globals: {
    page: 'readonly',
    browser: 'readonly',
    context: 'readonly',
    jestPuppeteer: 'readonly',
  },
  rules: {
    'no-console': 'off',
    'react/prop-types': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
