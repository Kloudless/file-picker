/**
 * Export common variables used by webpack, babel, and jest configs
 */

module.exports = {
  devServerPorts: {
    loader: 8081,
    picker: 8082,
  },
  /**
   * A list of paths in regexp format to specify which files / folders
   * babel should ignore.
   *
   * This list is used by
   * 1. 'ignore' option in babel.config.js
   * 2. 'transformIgnorePatterns' option in jest.conf.js
   */
  ignorePaths: [
    new RegExp('(bower_components)'),
    new RegExp(
      // eslint-disable-next-line max-len
      'node_modules/@kloudless/file-picker-plupload-module/(?!(jquery.ui.plupload))',
    ),
    new RegExp('node_modules/(?!(@kloudless/file-picker-plupload-module))'),
    new RegExp('lib/(?!(jquery.ajax-retry))'),
  ],
  /**
   * A list of paths to resolve module imports
   *
   * This list is used by
   * 1. 'module-resolver' plugin's root option in babel.config.js
   * 2. webpack's resolve.modules option
   */
  resolvePaths: ['src', 'lib', 'node_modules', 'bower_components'],
};
