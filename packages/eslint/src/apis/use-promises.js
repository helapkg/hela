'use strict';

const { CLIEngine } = require('eslint');
const { createAlwaysHook } = require('./utils');
const glob = require('../globbing');

module.exports = async ({ include, exclude, ...options }, report) => {
  const engine = new CLIEngine();
  const alwaysHook = createAlwaysHook(options, engine, report);

  await glob.promise({
    ...options,
    include,
    exclude,
    globOptions: { cwd: options.cwd, ...options.globOptions },
    hooks: {
      async always(ctx) {
        const { changed, notFound, file, cacheFile } = ctx;

        if (changed === false && notFound === false && cacheFile.metadata) {
          report.results.push(cacheFile.metadata.report);

          // eslint-disable-next-line no-continue
          return;
        }
        if (engine.isPathIgnored(file.path)) {
          // eslint-disable-next-line no-continue
          return;
        }

        await alwaysHook(ctx);
      },
    },
  });
};