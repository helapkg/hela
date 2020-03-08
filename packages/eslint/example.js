'use strict';

// require('v8-compile-cache');

const path = require('path');
const lintConfigItems = require('./src/lint-config.js');
const utils = require('./src/utils');

(async () => {
  const { config } = await utils.loadESLintConifg();
  const oldCfg = require(path.join(process.cwd(), './.lint.config.js'));

  // const { config: cfg, linter } = utils.injectIntoLinter(oldCfg);

  await lintConfigItems(config, {
    config: oldCfg,
    // linter,
    inject: true,
    // mapper: (ctx) => {
    //   const meta = ctx.cacheFile && ctx.cacheFile.metadata;
    //   const rep = (meta && meta.report) || null;

    //   if (rep) {
    //     if (rep.errorCount > 0 || rep.warningCount > 0) {
    //       console.error(utils.cleanFrame([rep]));
    //     }
    //   }

    //   return ctx;
    // },
  });

  const used = process.memoryUsage();

  Object.keys(used).forEach((key) => {
    console.log(
      `${key} ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`,
    );
  });

  // if (report.errorCount === 0 && report.warningCount === 0) {
  //   console.log('No problems found.');
  //   return;
  // }

  // const warnings = `and ${report.warningCount} warning(s) `;

  // console.log('');
  // console.log(`${report.errorCount} error(s) ${warnings}found.`);

  // if (report.errorCount > 0) {
  //   // eslint-disable-next-line unicorn/no-process-exit
  //   process.exit(1);
  // }
})();
