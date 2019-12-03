const path = require('path');
const common = require('./config/common');
const packages = require('./package.json');


/**
 * Define build options environment variables here
 * format: [var name]: default value
 * check README for variable names and purpose
 */
const buildEnvVarDefaults = {
  PICKER_URL:
    'https://static-cdn.kloudless.com/p/platform/file-picker/v2/index.html',
  // old version that supports custom_css
  PICKER_URL_V1:
    'https://static-cdn.kloudless.com/p/platform/explorer/explorer.html',
  BASE_URL: 'https://api.kloudless.com',
  // for development only
  KLOUDLESS_APP_ID: null,
};

const transformDefines = {
  VERSION: packages.version,
};

Object.keys(buildEnvVarDefaults).forEach((varName) => {
  transformDefines[varName] = (
    process.env[varName] || buildEnvVarDefaults[varName]);
});

module.exports = {
  presets: [
    ['@babel/preset-env', {
      useBuiltIns: 'usage',
      corejs: 3,
    }],
    // Used by storybook-react
    '@babel/preset-react',
  ],
  ignore: common.ignorePaths,
  plugins: [
    [
      'module-resolver', {
        // avoid node_modules path being relative path
        root: common.resolvePaths.filter(p => p !== 'node_modules'),
        alias: {
          'picker-config': path.resolve(__dirname, './src/picker/js/',
            (process.env.NODE_ENV === 'production'
              && !JSON.parse(process.env.DEBUG || false)) ?
              './config_prod.json' : './config.json'),
        },
      },
    ],
    [
      'transform-define', transformDefines,
    ],
  ],
  env: {
    transpile: {
      presets: [
        ['@babel/preset-env', {
          useBuiltIns: false,
        }],
        '@babel/preset-react',
      ],
    },
  },
};
