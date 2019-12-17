/**
 * Generate webpack configuration for Storybook React and Storybook Vue.
 */

const path = require('path');
const AutoPrefixer = require('autoprefixer');

module.exports = basePath => async ({ config }) => {
  config.module.rules.push(
    {
      test: /\.jsx?$/,
      include: [
        path.resolve(basePath, '..', '..', 'src', 'loader'),
        path.resolve(basePath, '..', 'stories'),
      ],
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
      },
    },
    {
      test: /\.less$/,
      use: [
        'style-loader',
        'css-loader',
        {
          loader: 'postcss-loader',
          options: { plugins: [AutoPrefixer()] },
        },
        'less-loader',
      ],
    },
  );

  return config;
};
