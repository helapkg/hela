/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

'use strict';

const fs = require('fs');
const path = require('path');
const glob = require('glob-cache');
const memoizeFs = require('memoize-fs');
const { CLIEngine, Linter } = require('eslint');

module.exports = async function smartOld({ include, exclude, ...options }) {
  const memoizer = memoizeFs({
    cachePath: path.join(process.cwd(), '.cache', 'verify-process'),
  });

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

  await glob({
    include,
    exclude,
    globOptions: { cwd: options.cwd, ...options.globOptions },
    always: true,

    async hook({ valid, missing, file, cacheFile, cacheLocation, cacache }) {
      // if (valid === false || (valid && missing)) {

      const meta = cacheFile && cacheFile.metadata;
      // const config = meta
      //   ? meta.eslintConfig
      //   : engine.getConfigForFile(file.path);

      const dirname = path.dirname(file.path);
      let config = null;
      if (eslintConfig[dirname]) {
        // console.log('using config for', dirname);
        config = eslintConfig[dirname];
      } else {
        // console.log('new config');
        config = meta ? meta.eslintConfig : engine.getConfigForFile(file.path);
        eslintConfig[dirname] = config;
      }

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

        cacache.put(cacheLocation, file.path, output, {
          metadata: {
            contents,
            output,
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
