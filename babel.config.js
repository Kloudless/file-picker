/* eslint-disable max-len */
const explorerUrl = (process.env.explorerUrl || 'https://static-cdn.kloudless.com/p/platform/explorer/explorer.html');

module.exports = {
  presets: [
    '@babel/env',
    // '@babel/preset-react',
    // 'babel-preset-vue',
  ],
  plugins: [
    'babel-plugin-stylus-compiler',
    [
      'transform-define', {
        EXPLORER_URL: explorerUrl,
      }],
  ],
};
