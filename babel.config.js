/* eslint-disable max-len */
const explorerUrl = (process.env.explorerUrl || 'https://static-cdn.kloudless.com/p/platform/explorer/explorer.html');

module.exports = {
  presets: [
    ['@babel/preset-env', {
      useBuiltIns: 'usage',
      corejs: 3,
    }],
    '@babel/preset-react',
  ],
  plugins: [
    'babel-plugin-stylus-compiler',
    [
      'transform-define', {
        EXPLORER_URL: explorerUrl,
        BASE_URL: process.env.BASE_URL || null,
      }],
  ],
};
