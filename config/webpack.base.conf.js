const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssNano = require('cssnano');
const AutoPrefixer = require('autoprefixer');

const common = require('./common');

const root = path.resolve(__dirname, '../');
const isDevelopment = process.env.NODE_ENV === 'development';

const cssMinifier = isDevelopment ? [] : [CssNano()];
const styleLoaders = [
  {
    loader: MiniCssExtractPlugin.loader,
    options: {
      hmr: isDevelopment,
    },
  },
  'css-loader',
  {
    loader: 'postcss-loader',
    options: {
      plugins: () => [
        AutoPrefixer(),
      ].concat(cssMinifier),
    },
  },
];

module.exports = {
  context: root,
  resolve: {
    extensions: ['.js'],
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
        use: styleLoaders,
      },
      {
        test: /\.styl$/,
        use: styleLoaders.concat(['stylus-loader']),
      },
      {
        test: /\.js$/,
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
    new webpack.ProvidePlugin({
      // expose jquery to global for jquery-ui
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      // expose mOxie to global for plupload
      mOxie: ['plupload/moxie', 'mOxie'],
    }),
  ],
  performance: {
    maxEntrypointSize: 10 * 1024 * 1024,
    maxAssetSize: 10 * 1024 * 1024,
  },
};
