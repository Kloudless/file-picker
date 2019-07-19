/**
 * Return a CopyWebpackPlugin to copy localization and cldr data into
 * dist folder.
 */

const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const srcPath = path.resolve(__dirname, '../src');
const cldrPath = path.resolve(__dirname, '../bower_components/cldr-data/');


module.exports = function getCopyFilesPlugin(distPath) {
  const localeDistPath = path.resolve(distPath, 'explorer/localization');
  const cldrDistPath = path.resolve(localeDistPath, 'cldr-data');

  return new CopyWebpackPlugin([
    {
      from: path.resolve(srcPath, 'explorer/localization'),
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
  ]);
};
