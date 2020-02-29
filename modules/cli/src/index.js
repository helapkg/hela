/* eslint-disable node/no-unsupported-features/node-builtins */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

'use strict';

const fs = require('fs');
const path = require('path');
const { hela, HelaError } = require('@hela/core');

const CWD = process.cwd();

const { log } = console;

const prog = hela();

prog
  .option('--cwd', 'some global flag')
  .option('--showStack', 'Show more detailed info when errors', false);

module.exports = async function main() {
  const cfg = await getConfig('hela', { cwd: CWD });

  if (!cfg || (cfg && !cfg.config)) {
    throw new HelaError('No config or preset found');
  }

  const config = cfg.filepath.endsWith('.json')
    ? fromJson(cfg.config)
    : cfg.config;

  if (process.argv.includes('--verbose')) {
    log('[info] hela: Loading config ->', path.relative(CWD, cfg.filepath));
  }

  if (!isValidConfig(config)) {
    throw new HelaError('No config found or invalid');
  }

  prog.extendWith(config);

  return prog.parse();
};

function fromJson(config) {
  if (typeof config === 'string') {
    if (config.length === 0) {
      throw new HelaError(
        'The "hela" field can only be object or non-empty string',
      );
    }

    return require(path.join(CWD, config));
  }

  // config.extends / pkg.hela.extends
  // TODOs:
  // should try to load config package (like `@hela/dev`) up to homedir,
  // and check if it is globally installed.
  // hint: detect-installed, get-installed-path, find-up and etc
  if (config && typeof config === 'object') {
    if (config.cwd) {
      if (!config.extends) {
        throw new HelaError(
          'When defining "cwd" option, you need to pass `extends` too.',
        );
      }

      return require(path.join(config.cwd, config.extends));
    }

    return require(config.extends);
  }

  throw new HelaError('Config can only be object or non-empty string');
}

function isValidConfig(val) {
  if (!val) return false;
  if (isObject(val)) {
    return true;
  }
  return false;
}

function isObject(val) {
  return val && typeof val === 'object' && Array.isArray(val) === false;
}

async function getConfig(name, { cwd } = {}) {
  let cfg = await getPkg(cwd);

  // ! suppport ESM config files, and/or the freaking .mjs
  // ! in some wa without the `esm` package,
  // ! because I assume that `hela` bundle will be even more huge
  // ! it's freaking that Hela is 3x bigger than the whole Deno (~10mb)!
  const jsConfigFiles = ['hela.config.js', '.helarc.js'];

  if (!cfg) {
    const filepath = jsConfigFiles
      .map((x) => path.join(cwd, x))
      .find((fp) => (fs.existsSync(fp) ? fp : false));

    let config = null;

    try {
      config = require(filepath);
    } catch (err) {
      if (process.argv.includes('--verbose')) {
        log('[error] hela: while loading config!', err.message || err);
      }
      config = null;
    }

    cfg = { config, filepath };
  }

  return cfg;
}

async function getPkg(cwd) {
  let pkg = null;
  const filepath = path.join(cwd, 'package.json');

  try {
    pkg = JSON.parse(await fs.promises.readFile(filepath, 'utf8'));
  } catch (err) {
    if (process.argv.includes('--verbose')) {
      log('[error] hela: while loading config!', err.message || err);
    }
    return null;
  }

  return pkg.hela ? { config: pkg.hela, filepath } : null;
}
