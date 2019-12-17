/**
 * Return a list of webpack plugins used to build picker script and page.
 */

const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');

const srcPath = path.resolve(__dirname, '../src');
const cldrPath = path.resolve(__dirname, '../bower_components/cldr-data/');


module.exports = function getPickerPlugins(distPath) {
  const localeDistPath = path.resolve(distPath, 'picker/localization');
  const cldrDistPath = path.resolve(localeDistPath, 'cldr-data');

  return [
    new webpack.ProvidePlugin({
      // expose jquery to global for jquery plugins
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      // expose mOxie to global for plupload
      mOxie: ['plupload/moxie', 'mOxie'],
    }),
    // copy less.js
    new CopyWebpackPlugin([
      {
        from: path.resolve(srcPath, '../node_modules/less/dist/less.min.js'),
        to: path.resolve(distPath, 'picker/less.js'),
      },
    ]),
    // copy *.less
    new CopyWebpackPlugin([
      {
        from: path.resolve(srcPath, 'picker/css/'),
        to: path.resolve(distPath, 'picker/less/'),
      },
    ]),
    // copy localization and cldr data
    new CopyWebpackPlugin([
      {
        from: path.resolve(srcPath, 'picker/localization'),
        to: localeDistPath,
      },
      {
        from: path.resolve(__dirname, '../lib/plupload/i18n/'),
        to: path.resolve(localeDistPath, 'plupload/i18n/'),
      },
      {
        context: cldrPath,
        from: 'main/**/@(numbers|ca-gregorian|timeZoneNames).json',
        to: cldrDistPath,
      },
      {
        context: cldrPath,
        from: 'supplemental/@(likelySubtags|numberingSystems|timeData|weekData)'
          + '.json',
        to: cldrDistPath,
      },
    ]),
    /** Attach an id to the picker script tag
     * for util.getBaseUrl() to identify the script tag
     * This plugin must be put after all HtmlWebpackPlugins
     */
    new ScriptExtHtmlWebpackPlugin({
      custom: {
        test: /picker\.js$/,
        attribute: 'id',
        value: 'kloudless-file-picker-script',
      },
    }),
  ];
};
