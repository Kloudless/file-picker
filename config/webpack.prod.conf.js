/* Webpack config for dev-server */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const baseWebpackConfig = require('./webpack.base.conf');
const getPickerPlugins = require('./picker-plugins');
const merge = require('./merge-strategy');

const distPath = path.resolve(__dirname, '../dist/');
const srcPath = path.resolve(__dirname, '../src');

const scripts = {
  react: [path.resolve(srcPath, 'loader/js/react/index.js')],
  vue: [path.resolve(srcPath, 'loader/js/vue/index.js')],
  loader: [path.resolve(srcPath, 'loader/js/interface.js')],
  loaderExportHelper: [path.resolve(__dirname, 'loader-export-helper.js')],
  picker: [path.resolve(srcPath, 'picker/js/app.js')],
};

const prodConfig = merge(baseWebpackConfig, {
  mode: 'production',
  devtool: '#source-map',
  optimization: {
    minimize: false,
  },
});

const prodMinifiedConfig = merge(prodConfig, {
  devtool: false,
  optimization: {
    minimize: true,
  },
});


module.exports = [
  // react, export to commonjs2
  merge(prodMinifiedConfig, {
    entry: { 'commonjs2/react.min': scripts.react },
    output: {
      libraryTarget: 'commonjs2',
    },
  }),
  // vue, export to commonjs2
  merge(prodMinifiedConfig, {
    entry: { 'commonjs2/vue.min': scripts.vue },
    output: {
      libraryTarget: 'commonjs2',
    },
  }),
  // loader, export to commonjs2
  merge(prodMinifiedConfig, {
    entry: { 'commonjs2/loader.min': scripts.loader },
    output: {
      libraryTarget: 'commonjs2',
    },
    plugins: [
      // copy *.d.ts
      new CopyWebpackPlugin([
        {
          from: path.resolve(srcPath, 'loader/js/interface.d.ts'),
          to: path.resolve(distPath, 'commonjs2/loader.d.ts'),
        },
      ]),
    ],
  }),
  // loader
  merge(prodConfig, {
    entry: {
      loader: scripts.loaderExportHelper,
    },
    output: {
      path: path.resolve(distPath, './loader'),
      filename: '[name].js',
      publicPath: './',
    },
  }),
  // loader, minimized
  merge(prodMinifiedConfig, {
    entry: {
      loader: scripts.loaderExportHelper,
    },
    output: {
      path: path.resolve(distPath, './loader'),
      filename: '[name].min.js',
      publicPath: './',
    },
    // safe guard to make sure the bundle doesn't include npm packages
    performance: {
      hints: 'error',
      maxAssetSize: 150 * 1024,
    },
  }),
  // picker, minified
  merge(prodMinifiedConfig, {
    entry: {
      picker: scripts.picker,
    },
    output: {
      path: path.resolve(distPath, './picker'),
      filename: '[name].js',
      publicPath: './',
    },
    plugins: [
      // picker page
      new HtmlWebpackPlugin({
        filename: path.resolve(distPath, 'picker/index.html'),
        template: path.resolve(srcPath, 'picker/templates/index.pug'),
        chunks: ['picker'],
      }),
    ].concat(getPickerPlugins(distPath)),
  }),
  // dev-server index page for dist-test
  merge(prodConfig, {
    entry: {
      index: path.resolve(__dirname, '../dev-server/index.js'),
    },
    output: {
      path: path.resolve(__dirname, '../test/dist/'),
      filename: '[name].js',
      publicPath: './',
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.ejs',
        template: path.resolve(__dirname, '../dev-server/index.ejs'),
        templateParameters: {
          distTest: true,
          // these variables will be supplied by test-dist-server
          appIdPlaceHolder: '<%= appId %>',
          pickerUrlPlaceHolder: '<%= pickerUrl %>',
        },
        chunks: [],
      }),
    ],
  }),
];
