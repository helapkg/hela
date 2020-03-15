'use strict';

// require('v8-compile-cache');
// const path = require('path');
// const JestWorker = require('jest-worker').default;
const utils = require('./utils');
const lintFilesWrapper = require('./lint-files');

module.exports = async function lintConfigItems(configArrayItems, options) {
  const opts = { ...utils.constants.DEFAULT_OPTIONS, ...options };

  // const report = {
  //   results: [],
  //   errorCount: 0,
  //   warningCount: 0,
  //   fixableErrorCount: 0,
  //   fixableWarningCount: 0,
  // };
  const configItems = await utils.pFlatten(
    configArrayItems,
    utils.createFunctionConfigContext(),
    opts,
  ); /* .reduce((acc, item, idx) => {
    const cfgItem = utils.nsToItem(item);

    if (typeof cfgItem === 'string') {
      throw new TypeError(
        'config item cannot be string other than starting with "eslint:"',
      );
    }
    cfgItem.name = cfgItem.name || `@position#${idx}`;

    return acc.concat(cfgItem);
  }, []); */

  const cfg = configItems
    // .filter((x) => (x && !x.files) || utils.isEslintNamespace(x))
    .filter((x) => x && !x.files)
    .reduce(utils.normalizeAndMerge, {});

  // console.log('cfg:', cfg);

  return Promise.all(
    configItems
      .filter((x) => x && x.files)
      .map(async (item) => {
        const { files, ...configItem } = item;
        const conf = utils.normalizeAndMerge(cfg, configItem);
        // console.log('files:', files);

        // rep.results
        // rep.errorCount += res.errorCount || 0;
        // rep.warningCount += res.warningCount || 0;
        // rep.fixableErrorCount += res.fixableErrorCount || 0;
        // rep.fixableWarningCount += res.fixableWarningCount || 0;
        // const itemReport = await lintFiles(item.files, { ...opts, mapper });

        await lintFilesWrapper(files, { ...opts, config: conf });

        // report.errorCount += itemReport.errorCount;
        // report.warningCount += itemReport.warningCount;
        // report.fixableErrorCount += itemReport.fixableErrorCount;
        // report.fixableWarningCount += itemReport.fixableWarningCount;

        // if (output.length > 0) {
        //   console.log(output);
        // }

        // reports.push(reportForConfigItem);
      }),
  );

  // const report = utils.createReportOrResult('results', reports);
  // return report;
};
