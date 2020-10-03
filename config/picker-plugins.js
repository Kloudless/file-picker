/**
 * Return a list of webpack plugins used to build picker script and page.
 */

const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');

const srcPath = path.resolve(__dirname, '../src');
const cldrPath = path.resolve(__dirname, '../bower_components/cldr-data/');

const getLocalizationCopyData = (pickerDistPath) => {
  const localeDistPath = path.join(pickerDistPath, 'localization');
  const cldrDistPath = path.join(localeDistPath, 'cldr-data');
  const copyData = [
    {
      from: path.resolve(srcPath, 'picker/localization'),
      to: localeDistPath,
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
  ];

  if (process.env.BUILD_LICENSE === 'AGPL') {
    copyData.push({
      from: path.resolve(__dirname,
        '../node_modules/@kloudless/file-picker-plupload-module/i18n/'),
      to: path.join(localeDistPath, 'plupload/i18n/'),
    });
  }
  return copyData;
};

module.exports = function getPickerPlugins(pickerDistPath) {
  return [
    new webpack.ProvidePlugin({
      // expose jquery to global for jquery plugins
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      // expose mOxie to global for plupload
      mOxie: ['@kloudless/file-picker-plupload-module/moxie', 'mOxie'],
    }),
    // copy less.js
    new CopyWebpackPlugin([
      {
        from: path.resolve(srcPath, '../node_modules/less/dist/less.min.js'),
        to: path.join(pickerDistPath, 'less.js'),
      },
    ]),
    // copy *.less
    new CopyWebpackPlugin([
      {
        from: path.resolve(srcPath, 'picker/css/'),
        to: path.join(pickerDistPath, 'less/'),
      },
    ]),
    // copy localization and cldr data
    new CopyWebpackPlugin(getLocalizationCopyData(pickerDistPath)),
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
