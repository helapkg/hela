/* eslint-disable max-statements */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const findPkg = require('find-pkg');
const memoizeFs = require('memoize-fs');
const { CLIEngine, Linter } = require('eslint');
const glob = require('./globbing');

module.exports = async function smartOld({ include, exclude, ...options }) {
  const memoizer = memoizeFs({
    cachePath: path.join(options.cwd, '.cache', 'verify-process'),
  });
  const configsCachePath = path.join(options.cwd, '.cache', 'directory-config');

  const linter = new Linter();
  const engine = new CLIEngine();

  const report = {
    results: [],
    errorCount: 0,
    warningCount: 0,
    fixableErrorCount: 0,
    fixableWarningCount: 0,
  };

  const eslintConfig = {};
  const rootDir = [];

  await glob.globCache({
    include,
    exclude,
    globOptions: { cwd: options.cwd, ...options.globOptions },
    always: true,
    // hooks: {
    //   async always({
    async hook({ valid, missing, file, cacheFile, cacheLocation, cacache }) {
      // if (valid === false || (valid && missing)) {

      const meta = cacheFile && cacheFile.metadata;
      // const config = meta
      //   ? meta.eslintConfig
      //   : engine.getConfigForFile(file.path);

      let config = null;

      // TODO write full resolved config to the directory, then load from there
      const key = rootDir.shift() || (await findPkg(path.dirname(file.path)));
      rootDir.push(key);

      // console.log(key);
      // Buffer.from(path.dirname(file.path))
      //   .toString('hex')
      //   .slice(0, 20);

      // const info = await cacache.get.info(configsCachePath, key);
      // const hash = await cacache.get.hasContent(
      //   configsCachePath,
      //   integrityFromContents(key),
      // );

      // const changed = hash === false;
      // const notFound = info === null;
      // if (changed || notFound === false) {

      const fnToMemoize = async (_) => {
        // console.log('sasa');
        const res = engine.getConfigForFile(file.path);

        return res;
      };

      const memoizedFnc = await memoizer.fn(fnToMemoize, { cacheId: key });

      config =
        meta && meta.eslintConfig
          ? meta.eslintConfig
          : eslintConfig[key] || (await memoizedFnc(key));

      eslintConfig[key] = config;

      // await cacache.put(configsCachePath, key, key, {
      //   metadata: { config },
      // });

      // eslintConfig[dirname] = config;

      // if (eslintConfig[dirname]) {
      //   // console.log('using config for', dirname);
      //   config = eslintConfig[dirname];
      // } else {
      //   // console.log('new config');
      //   config = meta ? meta.eslintConfig : engine.getConfigForFile(file.path);
      //   eslintConfig[dirname] = config;
      // }

      if (valid === false || (valid && missing)) {
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

            Object.keys(plugin.rules).forEach((ruleName) => {
              linter.defineRule(
                `${pluginName}/${ruleName}`,
                plugin.rules[ruleName],
              );
            });
          });
        if (config.parser) {
          linter.defineParser(config.parser, require(config.parser));
        }
      }

      const contents = file.contents.toString();
      const memoizedFunc = await memoizer.fn((cont, cfg) =>
        // console.log('content changed! ... verify called');

        linter.verifyAndFix(cont, cfg),
      );
      const { output, messages } = await memoizedFunc(contents, config);

      const result = {
        filePath: file.path,
        messages,
        errorCount: []
          .concat(messages)
          .filter(Boolean)
          .filter((x) => x.severity === 2)
          .reduce((acc) => {
            report.errorCount += 1;

            return acc + 1;
          }, 0),
        warningCount: []
          .concat(messages)
          .filter(Boolean)
          .filter((x) => x.severity === 1)
          .reduce((acc) => {
            report.warningCount += 1;

            return acc + 1;
          }, 0),
        fixableErrorCount: 0,
        fixableWarningCount: 0,
      };

      if (JSON.stringify(result) !== JSON.stringify(meta && meta.report)) {
        // console.log('report changed! re-add / store to cache');

        await cacache.put(cacheLocation, file.path, output, {
          metadata: {
            report: result,
            eslintConfig: config,
          },
        });
      }

      fs.writeFileSync(file.path, output);
      report.results.push({ ...result, source: output });
    },
  });

  return report;
};

// async function getConfigForDirectory(key, { cachePath, cacache }) {
//   const info = await cacache.get.info(cachePath, key);
//   let configCache = null;

//   if (info) {
//     console.log('wat?!');
//     try {
//       configCache = info.metadata && info.metadata.config;
//     } catch (err) {}
//   }

//   return configCache;
// }

function hasha(value, { algorithm = 'sha512', digest = 'base64' }) {
  return crypto
    .createHash(algorithm)
    .update(value)
    .digest(digest);
}

function integrityFromContents(contents, hash = 'sha512') {
  const id = hasha(contents, { algorithm: hash });

  return `${hash}-${id}`;
}
