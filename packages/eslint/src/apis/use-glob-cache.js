'use strict';

const { CLIEngine } = require('eslint');
const { createAlwaysHook } = require('./utils');
const glob = require('../globbing');

module.exports = async ({ include, exclude, ...options }, report) => {
  const engine = new CLIEngine();
  const alwaysHook = createAlwaysHook(options, engine, report);

  await glob.globCache({
    ...options,
    include,
    exclude,
    globOptions: { cwd: options.cwd, ...options.globOptions },
    always: true,
    async hook(ctx) {
      const { valid, missing, file, cacheFile } = ctx;

      if ((valid === false || (valid && missing)) && cacheFile.metadata) {
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
  });
};
