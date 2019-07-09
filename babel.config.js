const common = require('./config/common');
const path = require('path');
const packages = require('./package.json');


/**
 * Define build options environment variables here
 * format: [var name]: default value
 * check README for variable names and purpose
 */
const buildEnvVarDefaults = {
  EXPLORER_URL: (
    'https://static-cdn.kloudless.com/p/platform/explorer/explorer.html'),
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
        root: common.resolvePaths,
        alias: {
          'explorer-config': path.resolve(__dirname, './src/explorer/js/',
            process.env.NODE_ENV === 'production'
              ? './config_prod.json' : './config.json'),
        },
      },
    ],
    [
      'transform-define', transformDefines,
    ],
    [
      path.resolve(__dirname, './config/babel-modal-style-script'),
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
