/* eslint-disable max-len */
const explorerUrl = (process.env.explorerUrl || 'https://static-cdn.kloudless.com/p/platform/explorer/explorer.html');

module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      '@babel/preset-env',
      '@babel/preset-react',
    ],
    plugins: [
      'babel-plugin-stylus-compiler',
      [
        'transform-define', {
          EXPLORER_URL: explorerUrl,
        }],
    ],
  };
};
