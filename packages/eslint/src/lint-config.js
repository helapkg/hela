'use strict';

// const path = require('path');
// const JestWorker = require('jest-worker').default;
const { constants } = require('./utils');
const lintFilesWrapper = require('./lint-files');

module.exports = async function lintConfigItems(configArrayItems, options) {
  const opts = { ...constants.DEFAULT_OPTIONS, ...options };

  // const report = {
  //   results: [],
  //   errorCount: 0,
  //   warningCount: 0,
  //   fixableErrorCount: 0,
  //   fixableWarningCount: 0,
  // };

  return Promise.all(
    []
      .concat(configArrayItems)
      .filter(Boolean)
      .map(async (item) => {
        if (!item.files) {
          return;
        }

        // TODO
        // - lintFiles(item.files)
        // - injectIntoLinter

        // rep.results
        // rep.errorCount += res.errorCount || 0;
        // rep.warningCount += res.warningCount || 0;
        // rep.fixableErrorCount += res.fixableErrorCount || 0;
        // rep.fixableWarningCount += res.fixableWarningCount || 0;
        // const itemReport = await lintFiles(item.files, { ...opts, mapper });

        await lintFilesWrapper(item.files, opts);

        // const output = utils
        //   .formatCodeframe(itemReport.results, false)
        //   .trim()
        //   .split('\n')
        //   .slice(0, -2)
        //   .join('\n');

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
