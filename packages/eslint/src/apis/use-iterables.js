/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */

'use strict';

const { CLIEngine } = require('eslint');
const { createAlwaysHook } = require('./utils');
const glob = require('../globbing');

module.exports = async ({ include, exclude, ...options }, report) => {
  const engine = new CLIEngine();
  const alwaysHook = createAlwaysHook(
    { ...options, useConfigCache: true },
    engine,
    report,
  );
  const iterable = glob.stream({
    ...options,
    include,
    exclude,
    globOptions: { cwd: options.cwd, ...options.globOptions },
  });

  for await (const ctx of iterable) {
    const { changed, notFound, file, cacheFile } = ctx;

    if (changed === false && notFound === false && cacheFile.metadata) {
      report.results.push(cacheFile.metadata.report);

      continue;
    }
    if (engine.isPathIgnored(file.path)) {
      continue;
    }

    await alwaysHook(ctx);
  }
};
