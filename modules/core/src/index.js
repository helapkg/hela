/* eslint-disable max-classes-per-file */

'use strict';

const dargs = require('dargs');
const dirs = require('global-dirs');
const execa = require('execa');
const { Yaro, utils } = require('@hela/yaro');

const globalBins = [dirs.npm.binaries, dirs.yarn.binaries];

const defaultExecaOptions = {
  stdio: 'inherit',
  env: { ...process.env },
  cwd: process.cwd(),
  concurrency: 1,
};

/**
 *
 * @param {object} argv
 * @param {object} options
 */
function toFlags(argv, options) {
  const opts = { shortFlag: true, ...options };
  return dargs(argv, opts).join(' ');
}

/**
 *
 * @param {string|string[]} cmd
 * @param {object} [options]
 * @public
 */
async function exec(cmd, options = {}) {
  const envPATH = `${process.env.PATH}:${globalBins.join(':')}`;
  const env = { ...defaultExecaOptions.env, PATH: envPATH };

  return execa.command(cmd, { ...defaultExecaOptions, env, ...options });
  // return Exec(cmds, { ...defaultExecaOptions, env, ...options });
}

class HelaError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'HelaError';
  }
}

class Hela extends Yaro {
  constructor(progName = 'hela', options) {
    if (progName && typeof progName === 'object') {
      options = progName; // eslint-disable-line no-param-reassign
      progName = 'hela'; // eslint-disable-line no-param-reassign
    }
    super(progName, {
      defaultsToHelp: true,
      allowUnknownFlags: true,
      version: '3.0.0',
      ...options,
    });
    this.isHela = true;
  }
}

exports.Hela = Hela;
exports.HelaError = HelaError;
exports.hela = (...args) => new Hela(...args);
exports.exec = exec;
exports.toFlags = toFlags;
exports.default = exports.hela;

module.exports = Object.assign(exports.default, exports, { utils });
module.exports.default = module.exports;
