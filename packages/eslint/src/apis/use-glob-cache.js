'use strict';

const { CLIEngine } = require('eslint');
const { createAlwaysHook } = require('./utils');
const glob = require('../globbing');

module.exports = async ({ include, exclude, ...options }, report) => {
  const engine = new CLIEngine();
  const alwaysHook = createAlwaysHook(options, engine, report);

  await glob.globCache({
    include,
    exclude,
    globOptions: { cwd: options.cwd, ...options.globOptions },
    always: true,
    async hook(ctx) {
      const { valid, file, cacheFile } = ctx;

      if (valid && cacheFile && cacheFile.metadata) {
        report.results.push(cacheFile.metadata.report);
        return;
      }
      if (engine.isPathIgnored(file.path)) {
        // console.log('excluded', file.path);
        return;
      }
      // console.log('included', file.path);

      // console.log('okkk', cacheFile);
      await alwaysHook(ctx);
    },
  });
  // .then(async ({ results }) => {
  //   await Promise.all(
  //     results
  //       .filter(({ file }) => !engine.isPathIgnored(file.path))
  //       .map(async (ctx) => {
  //         await alwaysHook(ctx);
  //       }),
  //   );
  // });
};
