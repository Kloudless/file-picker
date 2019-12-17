/**
 * Export common variables used by webpack, babel, and jest configs
 */


module.exports = {
  /**
   * A list of paths in regexp format to specify which files / folders
   * babel should ignore.
   *
   * This list is used by
   * 1. 'ignore' option in babel.config.js
   * 2. 'transformIgnorePatterns' option in jest.conf.js
   */
  ignorePaths: [
    new RegExp('(node_modules)|(bower_components)'),
    new RegExp('lib/(?!(plupload/jquery.ui.plupload))'),
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
