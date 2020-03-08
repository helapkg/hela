/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */

'use strict';

// const fs = require('fs');
// const util = require('util');
const path = require('path');
const isGlob = require('is-glob');
const cacache = require('cacache');
// const fastGlob = require('fast-glob');
const memoizeFs = require('memoize-fs');
const globCache = require('glob-cache');
const { constants, ...utils } = require('./utils');

const memoizer = memoizeFs({
  cachePath: path.join(process.cwd(), '.cache', 'eslint-meta-cache'),
});
const toIntegrityPromise = memoizer.fn(utils.toIntegrity);

// (async () => {
//   const cliCacheLoc = path.join(process.cwd(), '.cache', 'eslint-global-cache');
//   await cacache
// })();

async function* resolvePatternsStream(patterns, options) {
  const opts = { ...constants.DEFAULT_OPTIONS, ...options };
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

// async function loadContexts(items, options) {
//   const opts = { ...constants.DEFAULT_OPTIONS, ...options, forceLoad: true };
//   const argsJson = JSON.stringify({ items, options: { ...options } });
//   const argsHash = utils.hasha(argsJson, { algorithm: 'md5', digest: 'hex' });
//   const globalCache = path.join(opts.cwd, '.cache', 'eslint-global-cache');
//   const toIntegrity = await toIntegrityPromise;

//   const ctx = await utils.hasInCache(
//     { path: argsHash, integrity: await toIntegrity(argsJson) },
//     { cacheLocation: globalCache },
//   );

//   console.log('load', ctx);

//   if (ctx.changed === false && ctx.notFound === false) {
//     return ctx.cacheFile && ctx.cacheFile.metadata.contexts;
//   }

//   const contexts = await resolveItems(items, opts);

//   await cacache.put(globalCache, argsHash, argsJson, {
//     metadata: { contexts },
//   });

//   return contexts;
// }

// async function lintItems(items, options) {
//   const opts = { ...constants.DEFAULT_OPTIONS, ...options, forceLoad: true };
//   const contexts = await loadContexts(items, opts);

//   // console.log(contexts);
//   return lintFiles(contexts, opts);
// }

async function lintConfigItems(configArrayItems, options) {
  const opts = { ...constants.DEFAULT_OPTIONS, ...options };

  const report = {
    results: [],
    errorCount: 0,
    warningCount: 0,
    fixableErrorCount: 0,
    fixableWarningCount: 0,
  };
  const mapper = (x) => opts.mapper(x, report) || x;

  await Promise.all(
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
        await lintFiles(item.files, { ...opts, mapper });

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
  return report;
}
async function lintFiles(items, options) {
  const opts = { ...constants.DEFAULT_OPTIONS, ...options, forceLoad: true };

  const contexts = await resolveItems(items, opts);

  const results = [];

  await Promise.all(
    contexts.map(async (ctx) => {
      const meta = ctx.cacheFile && ctx.cacheFile.metadata;

      if (ctx.changed === false && ctx.notFound === false) {
        // console.log(ctx.file.path);
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
        source,
      });

      // const cacheReport = (meta && meta.report) || {};

      // removing `source` from the meta cached,
      // because the `res` report doesn't have it either

      // const { source: src, ...rep } = cacheReport;
      // const { source: src, ...rep } = (meta && meta.report) || {};
      const rep = (meta && meta.report) || {};
      const reportChanged = JSON.stringify(res) !== JSON.stringify(rep);

      if (res.errorCount > 0 || res.warningCount > 0) {
        console.error(utils.cleanFrame([res]));
      }

      // const { config, ...setts } = opts;
      // console.log(setts, reportChanged, ctx.file.path);
      results.push(rep);

      if (reportChanged) {
        await cacache.put(ctx.cacheLocation, ctx.file.path, source, {
          metadata: { report: res },
        });
      }
    }),
  );

  const report = utils.createReportOrResult('results', results);
  report.contexts = contexts;

  return report;
}

// filepath, glob patterns or File
async function resolveItems(items, options) {
  const opts = { ...constants.DEFAULT_OPTIONS, ...options };

  const globs = [];
  const contexts = [];
  const toIntegrity = await toIntegrityPromise;

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
        if (utils.isContext(item)) {
          contexts.push(item);
          return;
        }

        const file = await utils.toFile(item, { toIntegrity });
        const $ctx = await utils.hasInCache(file, opts);

        const ctx = {
          file,
          ...$ctx,
          cacache,
          cacheLocation: opts.cacheLocation,
        };

        if (opts.forceLoad === true || ctx.changed) {
          contexts.push(ctx);
        }
      }),
  );

  const results = globs.length > 0 ? await resolvePatterns(globs, opts) : [];

  return results.concat(contexts).map(opts.mapper);
}

async function resolvePatterns(patterns, options) {
  const opts = { ...constants.DEFAULT_OPTIONS, ...options };

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

// TODO
// async function lintText(contents, options) {
//   const opts = { ...constants.DEFAULT_OPTIONS, ...options };
//   const source = contents;

//   return {
//     source,
//     errorCount: 0,
//     warningCount: 0,
//     fixableErrorCount: 0,
//     fixableWarningCount: 0,
//   };
// }

// lintItems([
//   // 'foobar.js',
//   // { path: 'foobar.js' },
//   // { path: 'foobar.js', contents: Buffer.from('var foobar = 1;')},
//   // { file: { path: 'foobar.js' } },
//   // { file: { path: 'foobar.js', contents: Buffer.from('sasa') } },

//   // and promises resolving to one of above
//   'modules/*/src/**/*.js',
//   Promise.resolve(path.join(process.cwd(), 'packages/eslint/src/api.js')),
// ]).then((report) => {
//   console.log(report.contexts);

//   // utils.formatCodeframe(report.results);
// });
(async () => {
  const { config } = await utils.loadESLintConifg();
  const oldCfg = require(path.join(process.cwd(), './.lint.config.js'));

  const { config: cfg, linter } = utils.injectIntoLinter(oldCfg);
  const report = await lintConfigItems(config, {
    config: cfg,
    linter,
    mapper: (ctx) => {
      const meta = ctx.cacheFile && ctx.cacheFile.metadata;
      const rep = (meta && meta.report) || null;

      if (rep) {
        if (rep.errorCount > 0 || rep.warningCount > 0) {
          console.error(utils.cleanFrame([rep]));
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
