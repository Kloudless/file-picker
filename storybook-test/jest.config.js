/* eslint-disable max-len */
const path = require('path');

// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html
module.exports = {
  // The root directory that Jest should scan for tests and modules within
  rootDir: path.resolve(__dirname),

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],

  // The regexp pattern or array of patterns that Jest uses to detect test files
  testRegex: './*\\.test\\.js$',

  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.[t|j]sx?$': 'babel-jest',
  },

  // A path to a module which exports an async function that is triggered once before all test suites
  globalSetup: '<rootDir>/tests/globalSetup.js',

  // A path to a module which exports an async function that is triggered once after all test suites
  globalTeardown: '<rootDir>/tests/globalTeardown.js',

  // The test environment that will be used for testing
  testEnvironment: '<rootDir>/tests/testEnvironment.js',
};
