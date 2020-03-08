/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */

'use strict';

const fs = require('fs');
const util = require('util');
const path = require('path');
const isGlob = require('is-glob');
const cacache = require('cacache');
const fastGlob = require('fast-glob');
const memoizeFs = require('memoize-fs');
const globCache = require('glob-cache');
const utils = require('./utils');

async function* resolvePatternsStream(patterns, options) {
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

async function lintFiles(items, options) {
  const opts = {
    ...utils.constants.DEFAULT_OPTIONS,
    ...options,
    forceLoad: true,
  };
  const contexts = await resolveItems(items, opts);

  const results = [];

  await Promise.all(
    contexts.map(async (ctx) => {
      const meta = ctx.cacheFile && ctx.cacheFile.metadata;

      if (ctx.changed === false && ctx.notFound === false) {
        results.push(meta.report);
        return;
      }

      const { source, messages } = utils.lint({
        ...opts,
        filename: ctx.file.path,
        contents: ctx.file.contents.toString(),
      });

      const res = utils.createReportOrResult('messages', messages, {
        filePath: ctx.file.path,
      });

      const reportChanged =
        JSON.stringify(res) !== JSON.stringify(meta && meta.report);

      results.push(res);

      if (opts.forceLoad === true || reportChanged) {
        await ctx.cacache.put(ctx.cacheLocation, ctx.file.path, source, {
          metadata: { report: res, source },
        });
      }
    }),
  );

  const report = utils.createReportOrResult('results', results);

  return report;
}

// filepath, glob patterns or File
async function resolveItems(items, options) {
  const opts = { ...utils.constants.DEFAULT_OPTIONS, ...options };

  const memoizer = memoizeFs({
    cachePath: path.join(opts.cwd, '.cache', 'glob-meta-cache'),
  });
  const toIntegrity = await memoizer.fn(utils.toIntegrity);

  const globs = [];
  const contexts = [];

  await Promise.all(
    []
      .concat(items)
      .filter(Boolean)
      .map(async (x) => {
        const item = await x;

        if (isGlob(item)) {
          globs.push(item);
          return;
        }

        const file = await utils.toFile(item, { toIntegrity });
        const info = await cacache.get.info(opts.cacheLocation, file.path);
        const hash = await cacache.get.hasContent(
          opts.cacheLocation,
          file.integrity,
        );

        const ctx = {
          file,
          changed: hash === false,
          notFound: info === null,
          cacache,
          cacheLocation: opts.cacheLocation,
        };

        ctx.cacheFile = info;

        if (opts.forceLoad === true || ctx.changed) {
          contexts.push(ctx);
        }
      }),
  );

  const results = globs.length > 0 ? await resolvePatterns(globs, opts) : [];

  return results.concat(contexts);
}

async function resolvePatterns(patterns, options) {
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

lintFiles([
  // 'foobar.js',
  // { path: 'foobar.js' },
  // { path: 'foobar.js', contents: Buffer.from('var foobar = 1;')},
  // { file: { path: 'foobar.js' } },
  // { file: { path: 'foobar.js', contents: Buffer.from('sasa') } },

  // and promises resolving to one of above
  'modules/*/src/**/*.js',
  Promise.resolve(path.join(process.cwd(), 'packages/eslint/src/api.js')),
]).then((report) => {
  utils.formatCodeframe(report.results);
});
