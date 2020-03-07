'use strict';

const fs = require('fs');
const util = require('util');

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

async function toFile(file) {
  if (isFile(file)) {
    return file;
  }

  if ((file && typeof file.path === 'string') || typeof file === 'string') {
    const contents = await readFile(file.path || file);
    return {
      path: file,
      contents,
      size: contents.length,
    };
  }

  throw new Error('@hela/eslint: unknown type, pass filepath or File object');
}

async function toContext(file) {
  if (isContext(file)) {
    return file;
  }
  const f = toFile(file);

  return { file: f, cacheFile: { key: f.path } };
}

module.exports = {
  isFile,
  isCacheFile,
  isContext,
  toContext,
  toFile,
  readFile,
  constants,
  processLint,
  loadESLintConifg,
  createFunctionConfigContext,
};
