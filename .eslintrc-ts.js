/**
 * Based on the .eslintrc.js.
 * All the configurations remain the same besides @typescript-eslint related
 * ones.
 */

const config = require('./.eslintrc.js');

config.globals.Kloudless = 'readonly';

config.extends = [
  'airbnb-base',
  'plugin:@typescript-eslint/recommended',
];
config.parser = '@typescript-eslint/parser';
config.plugins = ['@typescript-eslint'];

config.rules['@typescript-eslint/camelcase'] = 'off';
// disable import/named to avoid un-expected errors that actually work
// fine with typescript
config.rules['import/named'] = 'off';

module.exports = config;
