const path = require('path');

module.exports = async ({ config }) => {
  config.module.rules.push({
    test: /\.js$/,
    loader: 'babel-loader',
    include: [path.resolve(__dirname, '../../src')],
  });

  return config;
};
