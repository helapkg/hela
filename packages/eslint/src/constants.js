'use strict';

const DEFAULT_IGNORE = [
  '**/node_modules/**',
  '**/bower_components/**',
  'flow-typed/**',
  'coverage/**',
  '**/*fixture*/**',
  '{tmp,temp}/**',
  '**/*.min.js',
  '**/bundle.js',
  '**/vendor/**',
  '**/dist/**',
];

const DEFAULT_EXTENSIONS = ['js', 'jsx', 'cjs', 'mjs', 'ts', 'tsx'];
const DEFAULT_FILES = [
  `**/src/**/*.{${DEFAULT_EXTENSIONS.join(',')}}`,
  `**/*test*/**/*.{${DEFAULT_EXTENSIONS.join(',')}}`,
];

const DEFAULT_OPTIONS = {
  forceLoad: false,
  cacheLocation: '.cache/hela-eslint-cache',
};

module.exports = {
  DEFAULT_IGNORE,
  DEFAULT_FILES,
  DEFAULT_EXTENSIONS,
  DEFAULT_OPTIONS,
};
