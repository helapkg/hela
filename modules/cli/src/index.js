/* eslint-disable node/no-unsupported-features/node-builtins */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

'use strict';

const path = require('path');
const { hela, HelaError, utils } = require('@hela/core');
const { cosmiconfig } = require('cosmiconfig');

const { log } = console;

const argv = utils.parseArgv(process.argv.slice(2), {
  default: {
    cwd: process.cwd(),
    showStack: false,
    verbose: false,
  },
});

const explorer = cosmiconfig('hela');
const prog = hela();

prog
  .option('--cwd', 'some global flag', argv.cwd)
  .option('--verbose', 'Print more verbose output', false)
  .option('--showStack', 'Show more detailed info when errors', false)
  .option('-c, --config', 'Path to config file', 'hela.config.js');

module.exports = async function main() {
  const cfgPath = argv.c || argv.config;
  const cfg = cfgPath ? await explorer.load(cfgPath) : await explorer.search();

  if (!isValidConfig(cfg)) {
    throw new HelaError('No config found or invalid. Try "--config" flag.');
  }
  if (argv.verbose) {
    log('[info] hela: Loading ->', path.relative(argv.cwd, cfg.filepath));
  }

  let bypass = false;
  if (cfg.filepath.endsWith('package.json')) {
    const pkg = require(cfg.filepath);
    cfg.config = fromJson(pkg.hela);
    bypass = true;
  }

  if (bypass || cfg.filepath.endsWith('.js') || cfg.filepath.endsWith('.cjs')) {
    prog.extendWith(cfg.config);
  }

  return prog.parse();
};

function fromJson(config) {
  if (typeof config === 'string') {
    if (config.length === 0) {
      throw new HelaError(
        'The "hela" field can only be object or non-empty string',
      );
    }

    return require(path.join(argv.cwd, config));
  }

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

// async function getConfig(name, { cwd } = {}) {
//   let cfg = await getPkg(cwd);

//   // ! suppport ESM config files, and/or the freaking .mjs
//   // ! in some wa without the `esm` package,
//   // ! because I assume that `hela` bundle will be even more huge
//   // ! it's freaking that Hela is 3x bigger than the whole Deno (~10mb)!
//   const jsConfigFiles = ['hela.config.js', '.helarc.js'];

//   if (!cfg) {
//     const filepath = jsConfigFiles
//       .map((x) => path.join(cwd, x))
//       .find((fp) => (fs.existsSync(fp) ? fp : false));

//     let config = null;

//     try {
//       config = require(filepath);
//     } catch (err) {
//       if (process.argv.includes('--verbose')) {
//         log('[error] hela: while loading config!', err.message || err);
//       }
//       config = null;
//     }

//     cfg = { config, filepath };
//   }

//   return cfg;
// }

// async function getPkg(cwd) {
//   let pkg = null;
//   const filepath = path.join(cwd, 'package.json');

//   try {
//     pkg = JSON.parse(await fs.promises.readFile(filepath, 'utf8'));
//   } catch (err) {
//     if (process.argv.includes('--verbose')) {
//       log('[error] hela: while loading config!', err.message || err);
//     }
//     return null;
//   }

//   return pkg.hela ? { config: pkg.hela, filepath } : null;
// }
