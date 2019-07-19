/** Attach an id to the explorer script tag
 * for util.getBaseUrl() to identify the script tag
 * This plugin must be put after all HtmlWebpackPlugins
 */
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');

module.exports = new ScriptExtHtmlWebpackPlugin({
  custom: {
    test: /explorer\.js$/,
    attribute: 'id',
    value: 'kloudless-file-explorer-script',
  },
});
