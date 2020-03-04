/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable max-statements */

'use strict';

const fs = require('fs');
const path = require('path');
const memoizeFs = require('memoize-fs');
const { Linter } = require('eslint');

module.exports = { createAlwaysHook };

const eslintConfig = {};

function createAlwaysHook(opts, engine, report) {
  const verifyCachePath = path.join(opts.cwd, '.cache', 'verify-process');
  const configsCachePath = path.join(opts.cwd, '.cache', 'directory-config');

  const memoizerVerify = memoizeFs({ cachePath: verifyCachePath });
  const linter = new Linter();

  return async (ctx) => {
    const {
      file,
      changed,
      /* notFound, */
      cacheFile,
      cacache,
      cacheLocation,
    } = ctx;

    const meta = cacheFile && cacheFile.metadata;
    const key = path.dirname(file.path);

    let config = null;

    // if (eslintConfig[key]) {
    //   // console.log('using config for', key);
    //   config = eslintConfig[key];
    // } else {
    // console.log('new config');
    config = meta
      ? meta.eslintConfig
      : eslintConfig[key] || engine.getConfigForFile(file.path);
    eslintConfig[key] = config;
    // }

    // let config = opts.useConfigCache
    //   ? await getConfigForDirectory(key, {
    //       cachePath: configsCachePath,
    //       cacache,
    //     })
    //   : null;

    // if (!config) {
    //   config = eslintConfig[key] || engine.getConfigForFile(file.path);
    //   // console.log('config', config);

    //   if (opts.useConfigCache) {
    //     await cacache.put(
    //       configsCachePath,
    //       key,
    //       JSON.stringify(config),
    //     );
    //   } else {
    //     eslintConfig[key] = config;
    //   }
    // }

    // if (changed || notFound) {
    injectToLinter({ config, linter });
    // }

    const contents = file.contents.toString();
    const memoizedFunc = await memoizerVerify.fn((cont, cfg) =>
      // console.log('content changed! ... verify called');

      linter.verifyAndFix(cont, cfg),
    );
    const { output, messages } = await memoizedFunc(contents, config);

    const result = {
      filePath: file.path,
      messages,
      errorCount: calculateCount('error', messages, report),
      warningCount: calculateCount('warning', messages, report),
      fixableErrorCount: 0,
      fixableWarningCount: 0,
    };

    const diff = JSON.stringify(result) !== JSON.stringify(meta && meta.report);

    if (diff) {
      // console.log('report changed! re-add / store to cache');
      cacache.put(cacheLocation, file.path, output, {
        metadata: { report: result, eslintConfig: config },
      });
    }
    if (diff || changed) {
      fs.writeFileSync(file.path, output);
      report.results.push(result);
    }
  };
}

async function getConfigForDirectory(key, { cachePath, cacache }) {
  const info = await cacache.get.info(cachePath, key);
  let configCache = null;

  if (info) {
    try {
      configCache = JSON.parse(fs.readFileSync(info.path, 'utf8'));
    } catch (err) {}
  }

  return configCache;
}

function injectToLinter({ config, linter }) {
  config.plugins.forEach((pluginName) => {
    let plugin = null;

    if (pluginName.startsWith('@')) {
      plugin = require(pluginName);
    } else {
      plugin = require(`eslint-plugin-${pluginName}`);
    }

    Object.keys(plugin.rules).forEach((ruleName) => {
      linter.defineRule(`${pluginName}/${ruleName}`, plugin.rules[ruleName]);
    });
  });
  if (config.parser && config.parser.includes('babel-eslint')) {
    linter.defineParser('babel-eslint', require('babel-eslint'));
  }

  return linter;
}

function calculateCount(type, messages, report) {
  const rep = report;
  return []
    .concat(messages)
    .filter(Boolean)
    .filter((x) => (type === 'error' ? x.severity === 2 : x.severity === 1))
    .reduce((acc) => {
      if (type === 'error') {
        rep.errorCount += 1;
      }
      if (type === 'warning') {
        rep.warningCount += 1;
      }

      return acc + 1;
    }, 0);
}
