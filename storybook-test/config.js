/**
 * Common constants either used in storybook or jest.
 * 
 * Due to storybook's configuration, only env variables with 'STORYBOOK_' prefix
 * are available in storybook. To provide the same interface for both jest and
 * storybook. We modified .storybook/main.js to add the prefix for those
 * storybook specific env vars.
 * As a result, both *.story.js and *.test.js files can import this file to get
 * constants defined from env vars.
 * 
 * The effective path:
 *   storybook: env vars -> .storybook/main.js -> config.js -> *.story.js
 *        jest: env vars -> config.js -> *.test.js
 * Therefore, env vars with STORYBOOK_ are only available in storybook while
 * those without STORYBOOK_ are only available for jest.
 */
const { devServerPorts } = require('../config/common');

/**
 * Constants for both storybook and jest.
 */

const PICKER_URL = (
  process.env.STORYBOOK_PICKER_URL || process.env.PICKER_URL
  || `http://localhost:${devServerPorts.picker}/file-picker/v2/index.html`);
const BASE_URL = (
  process.env.STORYBOOK_BASE_URL || process.env.BASE_URL
  || 'https://api.kloudless.com');
const KLOUDLESS_ACCOUNT_TOKEN = (
  process.env.STORYBOOK_KLOUDLESS_ACCOUNT_TOKEN
  || process.env.KLOUDLESS_ACCOUNT_TOKEN || '');
const KLOUDLESS_APP_ID = (
  process.env.STORYBOOK_KLOUDLESS_APP_ID || process.env.KLOUDLESS_APP_ID || '');


const DEFAULT_GLOBAL_OPTIONS = {
  baseUrl: BASE_URL,
  pickerUrl: PICKER_URL,
};

const DEFAULT_CHOOSER_OPTIONS = {
  app_id: KLOUDLESS_APP_ID,
  tokens: [KLOUDLESS_ACCOUNT_TOKEN],
  multiselect: true,
  link: false,
  computer: true,
  services: ['all'],
  types: ['all'],
  display_backdrop: true,
};

const DEFAULT_SAVER_OPTIONS = {
  ...DEFAULT_CHOOSER_OPTIONS,
  files: [
    {
      url: 'https://s3-us-west-2.amazonaws.com/static-assets.kloudless.com/'
            + 'static/kloudless-logo-white.png',
      name: 'kloudless-logo.png',
    },
  ],
};


/**
 * Constants for jest.
 */

// id is determined by the story name.
const STORY_URL = {
  chooser: 'http://localhost:9001/iframe.html?id=e2e-test--chooser',
  saver: 'http://localhost:9001/iframe.html?id=e2e-test--saver',
  dropzone: 'http://localhost:9001/iframe.html?id=e2e-test--dropzone',
};

// Filename to store test data.
const TEST_DATA = '.fp_e2e_test_data.json';

module.exports = {
  PICKER_URL,
  BASE_URL,
  KLOUDLESS_ACCOUNT_TOKEN,
  KLOUDLESS_APP_ID,
  STORY_URL,
  DEFAULT_GLOBAL_OPTIONS,
  DEFAULT_CHOOSER_OPTIONS,
  DEFAULT_SAVER_OPTIONS,
  TEST_DATA,
};
