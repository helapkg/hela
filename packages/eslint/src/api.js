/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */

'use strict';

const fs = require('fs');
const util = require('util');
const path = require('path');
const cacache = require('cacache');
const fastGlob = require('fast-glob');
const globCache = require('glob-cache');
const utils = require('./utils');

async function* resolveFilesStream(patterns, options) {
  const opts = { ...utils.constants.DEFAULT_OPTIONS, ...options };
  const iterable = await globCache(patterns, opts);

  for await (const ctx of iterable) {
    if (opts.forceLoad === true) {
      yield ctx;
      continue;
    }
    if (ctx.changed) {
      yield ctx;
    }
  }
}

async function resolveFiles(patterns, options) {
  const opts = { ...utils.constants.DEFAULT_OPTIONS, ...options };

  const iterable = await globCache(patterns, opts);
  const results = [];

  for await (const ctx of iterable) {
    if (opts.forceLoad === true) {
      results.push(ctx);
      continue;
    }
    if (ctx.changed) {
      results.push(ctx);
    }
  }

  return results;
}

/**
 * Resolve and lint given glob patterns.
 *
 * @param {string|string[]} patterns - glob patterns to match
 * @param {*} options
 */
async function processFiles(patterns, options) {
  const opts = { ...utils.constants.DEFAULT_OPTIONS, ...options };
  const files = await resolveFiles(patterns, opts);

  return lintFiles(files, opts);
}

async function lintText(contents, options) {
  const opts = { ...utils.constants.DEFAULT_OPTIONS, ...options };
  const source = contents;

  return {
    source,
    errorCount: 0,
    warningCount: 0,
    fixableErrorCount: 0,
    fixableWarningCount: 0,
  };
}

/**
 * Lint already resolved Files, Contexts or full filepaths, or an array of them
 *
 * @param {File|File[]|Context|Context[]|string|string[]} items
 * @param {*} options
 */
async function lintItems(items, options) {
  const opts = { ...utils.constants.DEFAULT_OPTIONS, ...options };
  const report = {
    results: [],
    errorCount: 0,
    warningCount: 0,
  };

  await Promise.all(
    []
      .concat(items)
      .filter(Boolean)
      .map(async (item) => {
        if (opts.type === 'paths' || opts.type === 'files') {
          const file = await utils.toFile(await item);

          const repFromText = await lintText(file.contents, opts);

          // calcReport(report, repFromText);
          report.results.push(file.path);

          await cacache.put(opts.cacheLocation, file.path, repFromText.source, {
            metadata: {
              report: repFromText,
              config: opts.config,
            },
          });

          return;
        }
        if (opts.type === 'contexts') {
          const { file, cacheFile } = await item;
          const meta = cacheFile && cacheFile.metadata;
          const { source, ...repFromText } = await lintText(
            file.contents,
            opts,
          );

          const reportChanged =
            JSON.stringify(repFromText) !== JSON.stringify(meta && meta.report);

          if (opts.forceLoad === true || reportChanged) {
            // calcReport(report, repFromText);
            report.results.push(file.path);

            await cacache.put(opts.cacheLocation, file.path, source, {
              metadata: {
                report: { ...repFromText, source },
                config: opts.config,
              },
            });
          }
        }
      }),
  );

  return report;
}

async function lintFiles(files, options) {
  return lintItems(files, { ...options, type: 'files' });
}

// resolveFiles('modules/*/src/**/*.js', { forceLoad: true }).then(console.log);

lintFiles([
  // 'foobar.js',
  // { path: 'foobar.js' },
  // { path: 'foobar.js', contents: Buffer.from('var foobar = 1;')},
  // { file: { path: 'foobar.js' } },
  // { file: { path: 'foobar.js', contents: Buffer.from('sasa') } },

  // and promises resolving to one of above

  Promise.resolve(path.join(process.cwd(), 'packages/eslint/src/api.js')),
]).then(console.log);
