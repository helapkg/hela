'use strict';

const fs = require('fs');
const util = require('util');
// const path = require('path');
const crypto = require('crypto');

const cacache = require('cacache');
const findFileUp = require('find-file-up');
const importFresh = require('import-fresh');
const { Linter } = require('eslint');
const codeframe = require('eslint/lib/cli-engine/formatters/codeframe');

const eslintPackageJson = require('eslint/package.json');
const constants = require('./constants');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

async function loadESLintConifg(options) {
  const opts = { cwd: process.cwd(), ...options };
  const eslintConfigPath = await findFileUp('eslint.config.js', opts.cwd);

  if (!eslintConfigPath) {
    throw new Error(
      '@hela/eslint: No configuration found! Use `-c` or `--config-file` flags, or add `eslint.config.js` file',
    );
  }

  return {
    filepath: eslintConfigPath,
    config: opts.fresh
      ? importFresh(eslintConfigPath)
      : require(eslintConfigPath),
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
  return (
    (item &&
      isFile(item.file) &&
      (isCacheFile(item.cacheFile) || item.cacheFile === null)) ||
    false
  );
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

function hasha(value, options) {
  const opts = { algorithm: 'sha512', digest: 'base64', ...options };

  return crypto
    .createHash(opts.algorithm)
    .update(value)
    .digest(opts.digest);
}

function injectIntoLinter(config, linter) {
  if (!config) {
    return linter;
  }

  const linterInstance = linter || new Linter();

  []
    .concat(config.plugins)
    .filter(Boolean)
    .forEach((pluginName) => {
      let plugin = null;

      if (pluginName.startsWith('@')) {
        plugin = require(pluginName);
      } else {
        plugin = require(`eslint-plugin-${pluginName}`);
      }

      // note: defineRules is buggy
      Object.keys(plugin.rules).forEach((ruleName) => {
        linterInstance.defineRule(
          `${pluginName}/${ruleName}`,
          plugin.rules[ruleName],
        );
      });

      // note: otherwise this should work
      // linterInstance.defineRules(
      //   Object.keys(plugin.rules).reduce((acc, ruleName) => {
      //     acc[`${pluginName}/${ruleName}`] = plugin.rules[ruleName];

      //     return acc;
      //   }, {}),
      // );
    });

  if (config.parser && config.parser.startsWith('/')) {
    if (config.parser.includes('babel-eslint')) {
      config.parser = 'babel-eslint';
    } else if (config.parser.includes('@typescript-eslint/parser')) {
      config.parser = '@typescript-eslint/parser';
    }
    // NOTE: more parsers
  }

  // define only when we are passed with "raw" (not processed) config
  if (config.parser && !config.parser.startsWith('/')) {
    linterInstance.defineParser(config.parser, require(config.parser));
  }

  return { linter: linterInstance, config: { ...config } };
}

function toIntegrity(value) {
  const hashId = hasha(value);

  return `sha512-${hashId}`;
}

async function hasInCache(file, options) {
  const opts = { ...options };
  const info = await cacache.get.info(opts.cacheLocation, file.path);
  const hash = await cacache.get.hasContent(opts.cacheLocation, file.integrity);

  return {
    changed: hash === false,
    notFound: info === null,
    cacheFile: info,
  };
}

function createReportOrResult(type, results, extra) {
  const ret = {
    ...extra,
    errorCount: 0,
    warningCount: 0,
    fixableErrorCount: 0,
    fixableWarningCount: 0,
  };

  ret[type] = [];

  if (type === 'messages') {
    ret.errorCount = calculateCount('error', results);
    ret.warningCount = calculateCount('warning', results);
  }

  return results.reduce((acc, res) => {
    ret[type].push(res);

    if (type === 'results') {
      acc.errorCount += res.errorCount || 0;
      acc.warningCount += res.warningCount || 0;
      acc.fixableErrorCount += res.fixableErrorCount || 0;
      acc.fixableWarningCount += res.fixableWarningCount || 0;
    }

    return acc;
  }, ret);
}

function calculateCount(type, items) {
  return []
    .concat(items)
    .filter(Boolean)
    .filter((x) => (type === 'error' ? x.severity === 2 : x.severity === 1))
    .reduce((acc) => acc + 1, 0);
}

function lint(options) {
  const opts = { ...options };
  const cfg = { ...opts.config, filename: opts.filename };
  const linter = opts.linter || new Linter();
  const filter = (x) =>
    opts.warnings ? true : !opts.warnings && x.severity === 2;

  if (!opts.contents && !opts.text) {
    opts.contents = fs.readFileSync(cfg.filename, 'utf8');
  }
  if (opts.text) {
    cfg.filename = opts.filename || '<text>';
  }
  if (opts.fix) {
    const { output, messages } = linter.verifyAndFix(opts.contents, cfg);
    if (!opts.text) {
      fs.writeFileSync(cfg.filename, output);
    }

    return { source: output, messages: messages.filter(filter) };
  }

  const messages = linter.verify(opts.contents, cfg);
  return {
    source: opts.contents,
    messages: messages.filter(filter),
  };
}

function formatCodeframe(rep, log = true) {
  const res = codeframe(rep.results || rep);
  return log ? console.log(res) : res;
}

function cleanFrame(rep) {
  return formatCodeframe(rep.results || rep, false)
    .trim()
    .split('\n')
    .slice(0, -2)
    .join('\n');
}

module.exports = {
  isFile,
  isCacheFile,
  isContext,
  toFile,
  injectIntoLinter,
  hasha,
  hasInCache,
  toIntegrity,
  createReportOrResult,
  calculateCount,
  formatCodeframe,
  cleanFrame,
  lint,
  readFile,
  writeFile,
  constants,
  processLint,
  loadESLintConifg,
  createFunctionConfigContext,
};
