'use strict';

const { hela } = require('@hela/core');
const { createJestCommand } = require('./utils');

const prog = hela();

exports.createJestCommand = createJestCommand;

const createCommand = createJestCommand(prog);

exports.build = createCommand('build', 'Build output files, using Babel', {
  alias: ['buid', 'bulid', 'built'],
});
exports.bundle = createCommand('bundle', 'Bundle, using Rollup', {
  alias: ['bun', 'bundel', 'bunedl'],
});
exports.docs = createCommand('docs', 'Generate API docs, with Docks', {
  alias: ['doc', 'docks'],
});
exports.lint = createCommand('lint', 'Lint files, using ESLint+Prettier', {
  alias: ['l', 'lnt', 'lnit'],
});
exports.test = createCommand('test', 'Test files, using Jest', {
  alias: ['t', 'tst', 'tset'],
});
