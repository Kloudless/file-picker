// eslint-disable-next-line max-len
// https://github.com/smooth-code/jest-puppeteer#create-your-own-globalsetup-and-globalteardown
const { teardown: teardownPuppeteer } = require('jest-environment-puppeteer');
const { teardown: teardownDevServer } = require('jest-dev-server');


module.exports = async function globalTeardown(globalConfig) {
  await teardownPuppeteer(globalConfig);
  if (process.env.CI) {
    await teardownDevServer();
  }
};
