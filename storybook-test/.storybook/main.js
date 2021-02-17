const { devServerPorts } = require('../../config/common');

// Prefix with `STORYBOOK_` so that they can be accessed in stories.
[
  'PICKER_URL', 'BASE_URL', 'KLOUDLESS_ACCOUNT_TOKEN',
  'KLOUDLESS_APP_ID',  'LOADER_PATH',
].forEach(key=>{
  process.env[`STORYBOOK_${key}`] = process.env[key] || '';
});

process.env.STORYBOOK_LOADER_PATH = (
  process.env.LOADER_PATH || `http://localhost:${devServerPorts.loader}/sdk`
);

module.exports = {
  stories: ['../stories/**/*.stories.js'],
  addons: ['@storybook/addon-actions'],
};
