const DEBUG = Boolean(JSON.parse(process.env.DEBUG || false));

module.exports = {
  launch: {
    headless: !DEBUG,
    devtools: DEBUG,
    // Whether to pipe the browser process stdout and stderr into process.stdout
    // and process.stderr.
    dumpio: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--auto-open-devtools-for-tabs',
      // Need this to access iframe when turning off headless.
      // REF: https://github.com/puppeteer/puppeteer/issues/4960
      '--disable-features=site-per-process',
    ],
    ignoreDefaultArgs: ['--hide-scrollbars'],
    timeout: 60000, // timeout for launching browser
  },
  browser: 'chromium',
  browserContext: 'default',
};
