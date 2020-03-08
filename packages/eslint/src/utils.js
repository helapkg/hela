'use strict';

const fs = require('fs');
const util = require('util');
const path = require('path');
const crypto = require('crypto');

const findFileUp = require('find-file-up');
const importFresh = require('import-fresh');
const { Linter } = require('eslint');

const eslintPackageJson = require('eslint/package.json');
const constants = require('./constants');

const readFile = util.promisify(fs.readFile);

async function loadESLintConifg(cwd = process.cwd(), fresh) {
  const eslintConfigPath = await findFileUp('eslint.config.js', cwd);

  if (!eslintConfigPath) {
    throw new Error(
      '@hela/eslint: No configuration found! Use `-c` or `--config-file` flags, or add `eslint.config.js` file',
    );
  }

  return {
    filepath: eslintConfigPath,
    config: fresh ? importFresh(eslintConfigPath) : require(eslintConfigPath),
  };
}

function createFunctionConfigContext(/* cwd, fresh */) {
  // TODO load and resolve full final config object (all configs from config array merged)
  // const cfg = resolveAndMergeConfig(config);
  // const folderOfLoadedConfig = loadESLintConifg();

  return {
    name: 'eslint-next',
    version: eslintPackageJson.version,
    cwd: process.cwd(),
    hasRule(config, ruleId) {
      const cfg = config;
      const ruleParts = ruleId.split('/');
      const pluginName = ruleParts.length > 1 ? ruleParts[0] : 'internals';
      const ruleName = ruleParts.length > 1 ? ruleParts[1] : 'eslint-rule-name';
      const plugin = cfg.plugins[pluginName];

      // TODO Do we need to return false or throw in this case?
      // if (!plugin) {
      //   throw new Error(`@hela/eslint: Plugin with "${pluginName}" not found.`);
      // }
      if (!plugin) {
        return false;
      }
      if (!plugin.rules[ruleName]) {
        return false;
      }
      return true;
    },
  };
}

function processLint(options) {
  const opts = { ...options };
  const lintConfig = { ...opts.config, filename: opts.filename };
  const linter = opts.linter || new Linter();
  const filter = (x) =>
    opts.warnings ? true : !opts.warnings && x.severity === 2;

  if (!opts.contents && !opts.text) {
    opts.contents = fs.readFileSync(lintConfig.filename, 'utf8');
  }
  if (opts.text) {
    lintConfig.filename = opts.filename || '<text>';
  }
  if (opts.fix) {
    const { output, messages } = linter.verifyAndFix(opts.contents, lintConfig);
    if (!opts.text) {
      fs.writeFileSync(lintConfig.filename, output);
    }

    return { source: output, messages: messages.filter(filter) };
  }

  const messages = linter.verify(opts.contents, lintConfig);
  return {
    source: opts.contents,
    messages: messages.filter(filter),
  };
}

function isFile(x) {
  return Boolean(x && x.path && x.contents) || false;
}

function isCacheFile(x) {
  return Boolean(x && x.path && x.key && x.integrity && x.time) || false;
}

function isContext(item) {
  return (item && isFile(item.file) && isCacheFile(item.cacheFile)) || false;
}

async function toFile(file, options) {
  const opts = { toIntegrity, ...options };

  let x = file || {};

  if (typeof x === 'string') {
    x = { path: x };
  }
  if (x && typeof x.path === 'string') {
    x = { ...x, path: x.path };
  }

  x.contents = (x && x.contents) || (await readFile(x.path));
  x.size = x.contents.length;
  x.integrity = x.integrity || (await opts.toIntegrity(x.contents));

  return { ...x };
  // throw new Error('@hela/eslint: unknown type, pass filepath or File object');
}

function toIntegrity(value) {
  const hashId = crypto
    .createHash('sha512')
    .update(value)
    .digest('base64');

  return `sha512-${hashId}`;
}

module.exports = {
  isFile,
  isCacheFile,
  isContext,
  toFile,
  toIntegrity,
  readFile,
  constants,
  processLint,
  loadESLintConifg,
  createFunctionConfigContext,
};
