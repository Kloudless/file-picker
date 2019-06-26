const path = require('path');
const webpack = require('webpack');


function resolve(dir) {
  return path.join(__dirname, '../../', dir);
}

module.exports = {
  context: resolve('./'),
  mode: 'development',
  entry: {
    app: './src/explorer/js/app.js',
  },
  output: {
    path: resolve('dist/explorer/js/'),
    filename: 'explorer.js',
    publicPath: resolve('./'),
  },
  resolve: {
    extensions: ['.js', '.json'],
    modules: [
      'src', 'lib', 'node_modules', 'bower_components',
    ],
    alias: {
      // set these cldr alias to avoid webpack build error
      cldr$: 'cldrjs',
      cldr: 'cldrjs/dist/cldr',
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [resolve('src')],
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      // expose jquery to global for jquery-ui
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      // expose mOxie to global for plupload
      mOxie: ['plupload/moxie', 'mOxie'],
    }),
  ],
};
