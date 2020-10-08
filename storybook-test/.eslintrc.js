module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
  ],
  env: {
    jest: true,
  },
  globals: {
    // Jest Puppeteer exposes three globals: browser, page, context
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
