const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssNano = require('cssnano');
const AutoPrefixer = require('autoprefixer');

const common = require('./common');

const root = path.resolve(__dirname, '../');
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * @param {string} fileType less or css
 * @param {string} viewType picker or loader
 */
function getStyleLoaders(fileType, viewType) {
  const result = [];
  const miniCssExtractLoader = {
    loader: MiniCssExtractPlugin.loader,
    options: { hmr: isDevelopment },
  };
  const postCssLoader = {
    loader: 'postcss-loader',
    options: {
      plugins: isDevelopment ? [AutoPrefixer()] : [AutoPrefixer(), CssNano()],
    },
  };
  if (viewType === 'picker') {
    result.push(miniCssExtractLoader);
  } else if (viewType === 'loader') {
    result.push('style-loader');
  }
  result.push('css-loader', postCssLoader);
  if (fileType === 'less') {
    result.push('less-loader');
  }
  return result;
}

module.exports = {
  context: root,
  resolve: {
    extensions: ['.js', '.jsx'],
    modules: common.resolvePaths,
    alias: {
      // set these cldr alias to avoid webpack build error
      cldr$: 'cldrjs',
      cldr: 'cldrjs/dist/cldr',
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: getStyleLoaders('css', 'picker'),
      },
      {
        test: /loader\/css\/.*\.less$/,
        use: getStyleLoaders('less', 'loader'),
      },
      {
        test: /picker\/css\/.*\.less$/,
        use: getStyleLoaders('less', 'picker'),
      },
      {
        test: /\.jsx?$/,
        use: 'babel-loader',
      },
      {
        test: /\.pug$/,
        use: {
          loader: 'pug-loader',
          options: {
            pretty: isDevelopment,
          },
        },
      },
      {
        test: /\.png$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
          },
        },
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
  ],
  performance: {
    maxEntrypointSize: 10 * 1024 * 1024,
    maxAssetSize: 10 * 1024 * 1024,
  },
};
