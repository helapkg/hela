/* eslint-disable global-require */
/* eslint-disable max-statements */
/* eslint-disable no-restricted-syntax */

'use strict';

const fs = require('fs');
const path = require('path');
const { hela } = require('@hela/core');

const {
  DEFAULT_IGNORE,
  DEFAULT_INPUTS,
  OUR_CONFIG_FILENAME,
  ...api
} = require('./api');

function wrapper(prog) {
  return prog
    .option('--init', 'Create lint config from fully resolved ESLint config')
    .option('--fix', 'Automatically fix problems')
    .option('--warnings', 'Shows warnings too', false)
    .option('--reporter', 'Use a specific output format reporter')
    .option('--include', 'Input files or glob patterns', DEFAULT_INPUTS)
    .option('--exclude', 'Ignore patterns (multiple)', DEFAULT_IGNORE)
    .action(async (...args) => {
      const files = args.slice(0, -2);
      const argv = args[args.length - 2];

      console.log('files', files);
    });
}

function helaCommand() {
  return wrapper(hela().command('eslint [...files]', 'Lint using ESLint'));
}

module.exports = {
  ...api,
  wrapper,
  helaCommand,
};
