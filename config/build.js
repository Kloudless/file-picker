const webpack = require('webpack');
const path = require('path');

const argv = process.argv.slice(2);

if (argv.length === 1) {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const config = require(path.resolve(__dirname, '../', argv[0]));

  webpack(config, (err, stats) => {
    if (err) {
      // eslint-disable-next-line no-console
      console.error(err.stack || err);
      if (err.details) {
        // eslint-disable-next-line no-console
        console.error(err.details);
      }
      // Do not print build msg if there is any error.
      return;
    }

    const info = stats.toJson();

    if (stats.hasErrors()) {
      // eslint-disable-next-line no-console
      console.error(info.errors);
      // Do not print build msg if there is any error.
      return;
    }

    if (stats.hasWarnings()) {
      // eslint-disable-next-line no-console
      console.warn(info.warnings);
    }

    process.stdout.write(`${
      stats.toString({
        colors: true,
      })}\n\n${
      process.env.BUILD_LICENSE === 'AGPL' ?
        'This build is under AGPL license.\n' : (
          'This build is under MIT license.\n' +
          'Run `npm run build:agpl` to include support for ' +
          'local uploads via the Computer option.\n')
    }`);
  });
} else {
  // eslint-disable-next-line no-console
  console.error('Please provide the config filename as the first argument.');
}
