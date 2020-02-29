'use strict';

const glob = require('glob-cache');
const { hela } = require('@hela/core');

function wrapper(prog) {
  return prog
    .option('--fix', 'Automatically fix problems')
    .option('--input', 'Input files or glob patterns')
    .option('--format', 'Use a specific output format reporter')
    .option(
      '-c, --config',
      'Use this configuration, overriding .eslintrc.* config options if present',
    )
    .action((...args) => {
      const files = args.slice(0, -2);
      const argv = args[args.length - 2];
      const opts = args[args.length - 1];

      console.log(args);
      // console.log('opts', opts);
      console.log('files', files);
      console.log('argv', argv);
      // console.log('_selfBin', argv._selfBin);
    });
}

function helaCommand() {
  return wrapper(hela().command('eslint [...files]', 'Lint using ESLint'));
}

module.exports = {
  /* lintText, lintFiles, */
  wrapper,
  helaCommand,
};
