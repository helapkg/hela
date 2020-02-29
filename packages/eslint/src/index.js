'use strict';

const { hela } = require('@hela/core');

const helaCommand = hela()
  .command('eslint [...files]', 'Lint using ESLint')
  .option('--fix', 'Automatically fix problems')
  .option('-f, --format', 'Use a specific output format reporter')
  .option(
    '-c, --config',
    'Use this configuration, overriding .eslintrc.* config options if present',
  )
  .action((files) => {
    // TODO use glob-cache here
    console.log('files', files);
  });

module.exports = { /* lintText, lintFiles, */ helaCommand };
