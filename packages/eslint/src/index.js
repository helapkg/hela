'use strict';

const glob = require('glob-cache');
const { hela } = require('@hela/core');

const helaCommand = hela().command('eslint [...files]', 'Lint using ESLint');

function wrapper(prog) {
  return prog
    .option('--input', 'Input files or glob patterns')
    .option('--fix', 'Automatically fix problems')
    .option('--format', 'Use a specific output format reporter')
    .option(
      '-c, --config',
      'Use this configuration, overriding .eslintrc.* config options if present',
    )
    .action((...args) => {
      const files = args.slice(0, -2);
      const argv = args[args.length - 2];
      const opts = args[args.length - 1];
      console.log('opts', opts);
      console.log('files', files);
      console.log('argv', argv);
      console.log('_selfBin', argv._selfBin);
    });
}

module.exports = {
  /* lintText, lintFiles, */
  wrapper,
  helaCommand: wrapper(helaCommand),
};
