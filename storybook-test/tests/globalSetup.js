// eslint-disable-next-line max-len
// https://github.com/smooth-code/jest-puppeteer#create-your-own-globalsetup-and-globalteardown
const fs = require('fs');
const os = require('os');
const path = require('path');
const { setup: setupPuppeteer } = require('jest-environment-puppeteer');
const { setup: setupDevServer } = require('jest-dev-server');
const { BASE_URL, KLOUDLESS_ACCOUNT_TOKEN, TEST_DATA } = require('../config');
const ApiHelper = require('./integration/core/ApiHelper');
const { devServerPorts } = require('../../config/common');

const apiHelper = new ApiHelper(BASE_URL, KLOUDLESS_ACCOUNT_TOKEN);

// Global setup is executed once before all workers starts.
// In addition, the workers are run in different processes. We have to write
// test data to the file so workers can get data from file.
async function setupTestData() {
  const response = await apiHelper.listFolderContent('root');
  const data = { FOLDER_CONTENT: response.data.objects };
  const filepath = path.resolve(os.homedir(), TEST_DATA);
  fs.writeFileSync(filepath, JSON.stringify(data), { encoding: 'utf-8' });
}

module.exports = async function globalSetup(globalConfig) {
  await setupTestData();
  await setupPuppeteer(globalConfig);
  if (process.env.CI) {
    await setupDevServer([
      {
        command: 'npm run storybook',
        port: 9001,
        launchTimeout: 60000,
      },
      {
        command: 'npm run dev:story --prefix=../',
        port: devServerPorts.picker,
        launchTimeout: 60000,
      },
    ]);
  }
};
