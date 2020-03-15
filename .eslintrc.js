'use strict';

module.exports = {
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2020,
  },
  extends: [
    '@tunnckocore/eslint-config',
    '@tunnckocore/eslint-config/mdx',
    '@tunnckocore/eslint-config/jest',
    '@tunnckocore/eslint-config/node',
    '@tunnckocore/eslint-config/promise',
    '@tunnckocore/eslint-config/unicorn',
  ],
  rules: {
    'import/no-unresolved': 'off',
    'import/no-dynamic-require': 'off',
    'global-require': 'off',
  },
};
