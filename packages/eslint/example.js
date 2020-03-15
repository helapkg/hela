'use strict';

// require('v8-compile-cache');

// const path = require('path');

// const api = require('./src/api');
const utils = require('./src/utils');
const lingConfigItems = require('./src/lint-config');

(async () => {
  const { config } = await utils.loadESLintConifg();
  // const oldCfg = require(path.join(process.cwd(), './.lint.config.js'));

  // const { config: cfg, linter } = utils.injectIntoLinter(oldCfg);

  await lingConfigItems(config, {
    // config: oldCfg,
    // linter,
    fix: true,
    mapper: (ctx) => {
      const meta = ctx.cacheFile && ctx.cacheFile.metadata;
      const rep = (meta && meta.report) || null;
      if (rep) {
        // TODO there are problems with double reporting (and from cache)
        if (rep.errorCount > 0 || rep.warningCount > 0) {
          console.log('zzz');
          console.error(utils.cleanFrame([rep]));
          console.log('zzz');
        }
      }
      return ctx;
    },
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
