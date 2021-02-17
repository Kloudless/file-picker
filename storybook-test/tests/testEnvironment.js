// https://github.com/smooth-code/jest-puppeteer#extend-puppeteerenvironment
const fs = require('fs');
const os = require('os');
const path = require('path');
const PuppeteerEnvironment = require('jest-environment-puppeteer');
const { TEST_DATA } = require('../config');

class FilePickerTestEnvironment extends PuppeteerEnvironment {
  // Execute once in each worker.
  async setup() {
    await super.setup();

    // Read test data from file.
    const filepath = path.resolve(os.homedir(), TEST_DATA);
    let data = fs.readFileSync(filepath, { encoding: 'utf-8' });
    data = JSON.parse(data);
    Object.keys(data).forEach((key) => {
      this.global[key] = data[key];
    });
  }

  async teardown() {
    await super.teardown();
  }
}

module.exports = FilePickerTestEnvironment;
