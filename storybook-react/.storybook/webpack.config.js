const path = require('path');

module.exports = async ({config})=>{
  /**
   * Extend webpack config:
   * Let babel-loader include parent folder.
   */
  config.module.rules.push({
    test: /\.jsx?$/,
    include: [
      path.resolve(__dirname, '..', '..', 'src', 'loader'),
      path.resolve(__dirname, '..', 'stories'),
    ],
    exclude: /node_modules/,
    use: {
      loader: 'babel-loader',
    }
  });
  return config;
};