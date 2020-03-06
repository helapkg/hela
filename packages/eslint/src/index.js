/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable max-statements */
/* eslint-disable no-restricted-syntax */

'use strict';

const fs = require('fs');
const path = require('path');
const { hela } = require('@hela/core');
const {
  DEFAULT_IGNORE,
  DEFAULT_INPUTS,
  OUR_CONFIG_FILENAME,
  ...api
} = require('./api');

function wrapper(prog) {
  return prog
    .option('--init', 'Create lint config from fully resolved ESLint config')
    .option('--fix', 'Automatically fix problems')
    .option('--warnings', 'Shows warnings too', false)
    .option('--reporter', 'Use a specific output format reporter')
    .option('--include', 'Input files or glob patterns', DEFAULT_INPUTS)
    .option('--exclude', 'Ignore patterns (multiple)', DEFAULT_IGNORE)
    .action(async (...args) => {
      const files = args.slice(0, -2);
      const argv = args[args.length - 2];
      // const opts = args[args.length - 1];

      if (argv.init) {
        const rootLintConfigFile = path.join(
          process.cwd(),
          OUR_CONFIG_FILENAME,
        );
        const loadConfigContents = `\nmodule.exports = require('@hela/eslint').resolveConfig(__filename);`;

        // write our config loading resolution
        fs.writeFileSync(rootLintConfigFile, loadConfigContents);

        // import/require/load the resolved config
        const config = await require(rootLintConfigFile);

        // re-write the `.js` config file
        fs.writeFileSync(
          `${rootLintConfigFile}`,
          `module.exports = ${JSON.stringify(config)}`,
        );

        console.log('Done.');
        return;
      }

      const include = []
        .concat(files.length > 0 ? files : argv.include || DEFAULT_INPUTS)
        .reduce((acc, x) => acc.concat(x), [])
        .filter(Boolean);

      let exclude = []
        .concat(argv.exclude)
        .reduce((acc, x) => acc.concat(x), [])
        .filter(Boolean);
      exclude = exclude.length > 0 ? exclude : null;

      const report = {
        errorCount: 0,
        warningCount: 0,
        filesCount: 0,
      };

      const iterable = await api.lintFiles(include, { ...argv, exclude });

      for await (const { result } of iterable) {
        report.filesCount += 1;
        if (result.errorCount || result.warningCount) {
          const resultReport = api.createReportOrResult('results', [result]);

          report.errorCount += resultReport.errorCount || 0;
          report.warningCount += resultReport.warningCount || 0;

          const output = api
            .formatCodeframe(resultReport.results)
            .trim()
            .split('\n')
            .slice(0, -2)
            .join('\n');

          console.log(output);
        } else {
          // console.log('File:', report.filesCount, file.path);
        }
      }

      if (report.errorCount === 0 && report.warningCount === 0) {
        console.log('No problems found.');
        return;
      }

      const warnings = argv.warnings
        ? `and ${report.warningCount} warning(s) `
        : '';

      console.log('');
      console.log(`${report.errorCount} error(s) ${warnings}found.`);
      // formatCodeframe(report, true);
    });
}

function helaCommand() {
  return wrapper(hela().command('eslint [...files]', 'Lint using ESLint'));
}

module.exports = {
  ...api,
  wrapper,
  helaCommand,
};
