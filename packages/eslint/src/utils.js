/* eslint-disable no-param-reassign */

'use strict';

// require('v8-compile-cache');
// eslint:recommended eslint/conf/eslint-recommended.js
const fs = require('fs');
const util = require('util');
// const path = require('path');xx
const crypto = require('crypto');

const mixinDeep = require('mixin-deep');
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
    name: 'hela-eslint',
    version: eslintPackageJson.version,
    cwd: process.cwd(),
    // NOTE: removed from the RFC
    // hasRule(config, ruleId) {
    //   const cfg = config;
    //   const ruleParts = ruleId.split('/');
    //   const pluginName = ruleParts.length > 1 ? ruleParts[0] : 'internals';
    //   const ruleName = ruleParts.length > 1 ? ruleParts[1] : 'eslint-rule-name';
    //   const plugin = cfg.plugins[pluginName];

    //   // TODO Do we need to return false or throw in this case?
    //   // if (!plugin) {
    //   //   throw new Error(`@hela/eslint: Plugin with "${pluginName}" not found.`);
    //   // }
    //   if (!plugin) {
    //     return false;
    //   }
    //   if (!plugin.rules[ruleName]) {
    //     return false;
    //   }
    //   return true;
    // },
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

function defineRulesFrom(pluginName, rules, linter) {
  Object.keys(rules || {}).forEach((ruleName) => {
    linter.defineRule(`${pluginName}/${ruleName}`, rules[ruleName]);
  });
}

function isObject(val) {
  return Boolean(val && typeof val === 'object' && !Array.isArray(val));
}

// function load(val, loadType) {
//   let [, type = loadType, value] =
//     /(plugin|config|eslint|\/|@)?:?(.+)/i.exec(val) || [];

//   value = type === '/' || type === '@' ? type + value : value;
//   // type = value.startsWith('@') ? '@' : type;

//   const parts = value.split('/');

//   if (type === '@') {
//     value = value.split('/').slice(1);
//   }
// }

// function loadConfig(val) {
//   // e.g. `@tunnckocore/foo-config/mdx` or `promise/recommended`
//   const parts = val.split('/');

//   const name = parts.length === 2 ? parts[0] : `${parts[0]}/${parts[1]}`;
//   const key = parts.length === 2 ? parts[1] : parts[2];
// }

function loadPresetString(name) {
  if (name.includes('plugin:')) {
    const { plugin, key } = loadPlugin(name.slice(7));
    return { preset: plugin.configs[key], name, key };
  }
  const mod = name.startsWith('/')
    ? require(name)
    : eslintRequire('config', name);

  return { preset: mod, name, key: name };
}

function loadPlugin(val, plugins) {
  const parts = val.split('/');

  const name = parts.length === 2 ? parts[0] : `${parts[0]}/${parts[1]}`;
  const key = parts.length === 2 ? parts[1] : parts[2];

  const plugin = plugins ? plugins[name] : eslintRequire('plugin', name);

  return {
    plugin,
    name,
    key,
    parts,
  };
}

function loadParser(parser, plugins) {
  let parserMod = parser;
  let parserName = '';

  if (parser && typeof parser === 'string') {
    // supports:
    // - parser: '@my-scope/some-plugin/foo-parser`
    // - parser: 'some-plugin/foo-parser`
    if (parser.includes('/')) {
      const { plugin, key } = loadPlugin(parser, plugins);

      if (!isObject(plugin.parsers)) {
        throw new TypeError(
          'expect plugin "parsers" key to be an object like { "babel-eslint": require("babel-eslint") }',
        );
      }

      parserMod = plugin.parsers[key];
      parserName = key;
    } else {
      // backward compat
      // parser: 'babel-eslint`
      parserMod = require(parser);
      parserName = parser;
    }
  }

  if (!isObject(parserMod)) {
    throw new TypeError('expect parser to be an object or a string');
  }

  return {
    parser: parserMod,
    name: parserName || parserMod.name || 'unknown-parser',
  };
}

function eslintRequire(type, name, itIsParser) {
  let mod = null;
  if (name.startsWith('@')) {
    mod = require(name.includes('/') ? name : `${name}/eslint-${type}`);
  } else if (itIsParser) {
    mod = require(name);
  } else {
    mod = require(`eslint-${type}-${name}`);
  }

  return mod;
}

function injectIntoLinter(config, linter, linterOptions) {
  const linterInstance = linter || new Linter(linterOptions);
  if (!config) {
    return linterInstance;
  }

  Object.keys(config.plugins || {}).forEach((name) => {
    defineRulesFrom(name, config.plugins[name].rules, linterInstance);
  });

  if (config.languageOptions && config.languageOptions.parser) {
    const { parser, name: parserName } = loadParser(
      config.languageOptions.parser,
      config.plugins,
    );

    linterInstance.defineParser(parserName, parser);
  }

  // NOTE: delete `config.parser`, `config.plugins` and `config.extends` intentionally,
  // because linter.verify/verifyAndFix may not understand the new definitions
  const {
    plugins: _,
    parser: __,
    extends: ___,
    overrides: $$,
    ...cleanedConfig
  } = config;
  // delete config.plugins;
  // delete config.parser;

  // if (config.parser && config.parser.startsWith('/')) {
  //   if (config.parser.includes('babel-eslint')) {
  //     config.parser = 'babel-eslint';
  //   } else if (config.parser.includes('@typescript-eslint/parser')) {
  //     config.parser = '@typescript-eslint/parser';
  //   }
  //   // NOTE: more parsers
  // }

  // define only when we are passed with "raw" (not processed) config
  // if (config.parser && !config.parser.startsWith('/')) {
  //   linterInstance.defineParser(config.parser, require(config.parser));
  // }

  return { linter: linterInstance, config: cleanedConfig };
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
  const opts = { inject: true, ...options };
  const cfg = { ...opts.config, filename: opts.filename };
  const filter = (x) =>
    opts.warnings ? true : !opts.warnings && x.severity === 2;

  const linterOptions =
    cfg.linterOptions ||
    (cfg.languageOptions && cfg.languageOptions.linterOptions) ||
    opts.linterOptions;

  const $linter = opts.linter || new Linter(linterOptions);
  const { config, linter } = opts.inject
    ? injectIntoLinter(cfg, $linter, linterOptions)
    : { config: cfg, linter: $linter };

  if (!opts.contents && !opts.text) {
    opts.contents = fs.readFileSync(config.filename, 'utf8');
  }
  if (opts.text) {
    config.filename = opts.filename || '<text>';
  }
  if (opts.fix) {
    const { output, messages } = linter.verifyAndFix(opts.contents, config);
    if (!opts.text) {
      fs.writeFileSync(config.filename, output);
    }

    return { source: output, messages: messages.filter(filter) };
  }

  const messages = linter.verify(opts.contents, config);
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

async function pFlatten(arr, ...args) {
  const items = await (
    await Promise.all([].concat(arr).filter(Boolean))
  ).reduce(async (acc, e) => {
    const accum = await acc;

    let item = await e;

    if (typeof item === 'function') {
      item = await item(...args);
    }
    if (!item) {
      return accum;
    }
    if (Array.isArray(item)) {
      // if the element is an array, fall flatten on it again and then take the returned value and concat it.
      return accum.concat(await pFlatten(item));
    }
    // otherwise just concat the value.
    return accum.concat(item);
  }, Promise.resolve([])); // initial value for the accumulator is []

  return (await Promise.all(items)).filter(Boolean);
}

function normalizePlugins(plugins) {
  if (!plugins) {
    return {};
  }
  if (typeof plugins !== 'object') {
    throw new TypeError(
      'plugins property is expected to be an object like { react: require("eslint-plugin-react") } or an array of plugin name strings like ["react"]',
    );
  }
  if (Array.isArray(plugins)) {
    return plugins.reduce((acc, pluginName) => {
      if (typeof pluginName !== 'string') {
        throw new TypeError(
          'when plugins is an array it can contain only strings',
        );
      }
      acc[pluginName] = eslintRequire('plugin', pluginName);
      return acc;
    }, {});
  }

  return plugins;
}

function nsToItem(item) {
  if (isEslintNamespace(item)) {
    item = { name: item };
    item.rules = require(`eslint/conf/${item.name.replace(':', '-')}`).rules;
  }
  return item;
}

// TODO for easier migration, temporary:
// - those without `files` will be able to accept old format too
// - for those with `files`, accept only the new format
function normalizeAndMerge(target, item, idx) {
  item.plugins = normalizePlugins(item.plugins);

  // const res = { plugins: {} };
  const { plugins: _, ...x } = item;
  // const { plugins: _, ...targ } = target;
  const res = mixinDeep({ ...target }, x);
  // const accum = mixinDeep({ ...target }, item);

  // const plgs = (whenFiles === true ? target.plugins : res.plugins) || {};

  Object.keys(item.plugins).forEach((pluginName) => {
    if (res.plugins && res.plugins[pluginName]) {
      throw new Error(
        `config item "${item.name ||
          idx}" trying to override "${pluginName}" plugin namespace`,
      );
    }

    res.plugins = res.plugins || {};
    res.plugins[pluginName] = item.plugins[pluginName];
  });

  // if (!accum.languageOptions) {
  //   accum.languageOptions = {
  //     parserOptions: { ...accum.parserOptions },
  //     globals: { ...accum.globals },
  //     parser: accum.parser,
  //   };
  //   accum.languageOptions.sourceType =
  //     accum.languageOptions.parserOptions.sourceType;
  // }
  // const lang = { ...accum.languageOptions };

  // if (lang.sourceType === 'commonjs') {
  //   lang.sourceType = 'script';
  // }
  // if (
  //   lang.sourceType === 'commonjs' ||
  //   (lang.globals &&
  //     (lang.globals.node === true || lang.globals.commonjs === true))
  // ) {
  //   lang.globals = {
  //     ...lang.globals,
  //     require: true,
  //     exports: true,
  //     module: true,
  //   };
  //   lang.parserOptions = mixinDeep(
  //     { ...lang.parserOptions },
  //     { ecmaFeatures: { globalReturn: true } },
  //   );
  // }

  // accum.parserOptions = mixinDeep(
  //   accum.parserOptions,
  //   // {
  //   //   ecmaVersion: lang.ecmaVersion,
  //   //   sourceType: lang.sourceType,
  //   // },
  //   lang.parserOptions,
  // );
  // accum.globals = mixinDeep(accum.globals, lang.globals);

  // accum.languageOptions = lang || accum.parserOptions;

  return res;
}

function isEslintNamespace(x) {
  return typeof x === 'string' && x.startsWith('eslint:');
}

function createItemsFromExtends(presets) {
  const $extends = []
    .concat(presets)
    .filter(Boolean)
    .filter((x) => !isEslintNamespace(x))
    .filter(Boolean);

  return $extends.reduce((acc, name) => {
    let mod = null;

    const { preset } = loadPresetString(name);
    mod = preset;

    if (mod.extends) {
      return acc.concat(createItemsFromExtends(mod.extends));
    }

    return acc.concat({
      ...mod,
      name,
      plugins: normalizePlugins(mod.plugins),
    });
  }, []);
}

module.exports = {
  isFile,
  isCacheFile,
  isContext,
  isEslintNamespace,
  nsToItem,
  toFile,
  injectIntoLinter,
  hasha,

  pFlatten,
  normalizeAndMerge,
  normalizePlugins,
  loadParser,
  loadPlugin,
  loadPresetString,
  createItemsFromExtends,
  defineRulesFrom,
  eslintRequire,
  isObject,

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
