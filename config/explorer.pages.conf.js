const HtmlWebpackPlugin = require('html-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const path = require('path');

const root = path.resolve(__dirname, '../');

module.exports = function getExplorerPagesPlugins(scriptChunk, outputPath) {
  return [
    // explorer page
    new HtmlWebpackPlugin({
      filename: path.resolve(outputPath, './explorer/explorer.html'),
      template: path.resolve(root, 'src/explorer/templates/index.pug'),
      chunks: [scriptChunk],
    }),
    // explorer template page
    new HtmlWebpackPlugin({
      filename: path.resolve(outputPath, './template/explorer.html'),
      template: path.resolve(root, 'src/explorer/templates/explorer.pug'),
      chunks: [],
    }),
    /** Attach an id to the explorer script tag
     * for util.getBaseUrl() to identify the script tag
     * This plugin must be put after all HtmlWebpackPlugins */
    new ScriptExtHtmlWebpackPlugin({
      custom: {
        test: /explorer\.js$/,
        attribute: 'id',
        value: 'kloudless-file-explorer-script',
      },
    }),
  ];
};
