/**
 * Constants for both storybook and jest.
 */

// This is a general interface to let both storybook and jest be able to access
// env vars with the same default values.
// For storybook, only env vars that prefixed by STORYBOOK_ are available.
// For jest, only env vars that aren't prefixed by STORYBOOK_ are available.
const PICKER_URL = (
  process.env.STORYBOOK_PICKER_URL || process.env.PICKER_URL
  || 'http://localhost:8082/file-picker/v2/index.html');
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
