const { configureToMatchImageSnapshot } = require('jest-image-snapshot');

const toMatchImageSnapshot = configureToMatchImageSnapshot({
  // https://github.com/americanexpress/jest-image-snapshot#%EF%B8%8F-api
  comparisonMethod: 'pixelmatch',
  customDiffConfig: {
    threshold: 0.5,
  },
  blur: 1,
});
expect.extend({ toMatchImageSnapshot });

jest.setTimeout(5 * 60 * 1000);
