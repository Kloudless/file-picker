/* eslint-disable max-len */
const explorerUrl = (process.env.explorerUrl || 'https://static-cdn.kloudless.com/p/platform/explorer/explorer.html');

module.exports = {
  presets: [
    '@babel/env',
  ],
  plugins: [
    'babel-plugin-stylus-compiler',
    [
      'transform-define', {
        EXPLORER_URL: explorerUrl,
      }],
  ],
};
