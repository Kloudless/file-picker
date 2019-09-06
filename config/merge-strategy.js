const merge = require('webpack-merge');

module.exports = merge.strategy(
  {
    'module.rules': 'append',
    plugins: 'append',
  },
);
