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

// filepath, glob patterns or File
async function resolveItems(items, options) {
  const opts = { ...utils.constants.DEFAULT_OPTIONS, ...options };

  const memoizer = memoizeFs({
    cachePath: path.join(process.cwd(), '.cache', 'glob-meta-cache'),
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

        // NOTE: not here!
        // if (ctx.changed) {
        //   await cacache.put(opts.cacheLocation, file.path, file.contents);
        // }

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

/**
 * Resolve and lint given glob patterns.
 *
 * @param {string|string[]} patterns - glob patterns to match
 * @param {*} options
 */
// async function processFiles(patterns, options) {
//   const opts = { ...utils.constants.DEFAULT_OPTIONS, ...options };
//   const files = await resolveFiles(patterns, opts);

//   return lintFiles(files, opts);
// }

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
// async function lintItems(items, options) {
//   const opts = { ...utils.constants.DEFAULT_OPTIONS, ...options };
//   const report = {
//     results: [],
//     errorCount: 0,
//     warningCount: 0,
//   };

//   await Promise.all(
//     []
//       .concat(items)
//       .filter(Boolean)
//       .map(async (item) => {
//         if (opts.type === 'paths' || opts.type === 'files') {
//           const file = await utils.toFile(await item);

//           const repFromText = await lintText(file.contents, opts);

//           // calcReport(report, repFromText);
//           report.results.push(file.path);

//           await cacache.put(opts.cacheLocation, file.path, repFromText.source, {
//             metadata: {
//               report: repFromText,
//               config: opts.config,
//             },
//           });

//           return;
//         }
//         if (opts.type === 'contexts') {
//           const { file, cacheFile } = await item;
//           const meta = cacheFile && cacheFile.metadata;
//           const { source, ...repFromText } = await lintText(
//             file.contents,
//             opts,
//           );

//           const reportChanged =
//             JSON.stringify(repFromText) !== JSON.stringify(meta && meta.report);

//           if (opts.forceLoad === true || reportChanged) {
//             // calcReport(report, repFromText);
//             report.results.push(file.path);

//             await cacache.put(opts.cacheLocation, file.path, source, {
//               metadata: {
//                 report: { ...repFromText, source },
//                 config: opts.config,
//               },
//             });
//           }
//         }
//       }),
//   );

//   return report;
// }

// async function lintFiles(files, options) {
//   return lintItems(files, { ...options, type: 'files' });
// }

// resolveFiles('modules/*/src/**/*.js', { forceLoad: true }).then(console.log);

resolveItems([
  // 'foobar.js',
  // { path: 'foobar.js' },
  // { path: 'foobar.js', contents: Buffer.from('var foobar = 1;')},
  // { file: { path: 'foobar.js' } },
  // { file: { path: 'foobar.js', contents: Buffer.from('sasa') } },

  // and promises resolving to one of above
  'modules/*/src/**/*.js',
  Promise.resolve(path.join(process.cwd(), 'packages/eslint/src/api.js')),
]).then(console.log);

async function lintFiles(items, options) {
  const opts = { ...utils.constants.DEFAULT_OPTIONS, ...options };
  const contexts = await resolveItems(items, options);
}
