module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
  ],
  // We have config.js which is used by jest and storybook.
  // Jest globalSetup.js and testEnvironment.js only accepts CommonJS while
  // storybook uses ES6 module syntax.
  // This plugin helps resolve the problems of mixing CommonJS and ES6 module.
  plugins: ['@babel/plugin-transform-modules-commonjs'],
};
