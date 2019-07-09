const merge = require('webpack-merge');

module.exports = merge.strategy(
  {
    'module.rules': 'prepend',
    plugins: 'append',
    'module.rules.use': 'prepend',
  },
);
