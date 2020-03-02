'use strict';

const glob = require('glob-cache');
const { hela } = require('@hela/core');
const codeframe = require('eslint/lib/cli-engine/formatters/codeframe');
const memoizeFs = require('memoize-fs');
const {
  DEFAULT_INPUTS,
  DEFAULT_IGNORE,
  smartLintFiles,
  lintFiles,
} = require('./api');

// const memoizer = memoizeFs({
//   cachePath: './.cache-memoized',
// });

function wrapper(prog) {
  return prog

    .option('--fix', 'Automatically fix problems')
    .option('--reporter', 'Use a specific output format reporter')
    .option('--include', 'Input files or glob patterns', DEFAULT_INPUTS)
    .option('--exclude', 'Ignore patterns', DEFAULT_IGNORE)
    .option(
      '-c, --config',
      'Use this configuration, overriding .eslintrc.* config options if present',
    )
    .action(async (...args) => {
      const files = args.slice(0, -2);
      const argv = args[args.length - 2];
      const opts = args[args.length - 1];

      const include = []
        .concat(files.length > 0 ? files : argv.include || DEFAULT_INPUTS)
        .reduce((acc, x) => acc.concat(x), [])
        .filter(Boolean);

      const exclude = []
        .concat(argv.exclude || DEFAULT_IGNORE)
        .reduce((acc, x) => acc.concat(x), [])
        .filter(Boolean);

      console.log(include);
      console.log(argv);

      const report = await (argv.smart ? smartLintFiles : lintFiles)(
        include,
        argv,
      );
      // console.log(report);
      // console.log(report.results[0]);
      format(report.results);

      // await glob({
      //   include,
      //   exclude,
      //   globOptions: { cwd: argv.cwd },
      //   always: true,

      //   async hook(ctx) {
      //     const {
      //       valid,
      //       missing,
      //       file,
      //       cacheFile,
      //       cacache,
      //       cacheLocation,
      //     } = ctx;
      //     console.log('hit1', valid, missing);

      //     const report = await smartLintFiles(file.path, argv);

      //     // console.log(engine.getConfigForFile(file.path));
      //     console.log(JSON.stringify(report, null, 2));
      //     format(report.results);
      //   },
      // });
    });
}

function hasReportChanged(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function format(reportResults) {
  console.log(codeframe(reportResults));
}

function helaCommand() {
  return wrapper(hela().command('eslint [...files]', 'Lint using ESLint'));
}

module.exports = {
  /* lintText, lintFiles, */
  wrapper,
  helaCommand,
};

// file changed    OR    first hit
// if (valid === false || (valid && missing)) {
//   console.log('hit2', valid, missing);
//   const report = await lintFiles(file.path, argv);
//   const cacheReport = cacheFile && cacheFile.metadata;
//   const { results, errorCount, warningCount } = report;

//   const isReportChanged = hasReportChanged(
//     { results, errorCount, warningCount },
//     cacheReport,
//   );
//   console.log(valid, missing, isReportChanged);

//   if (
//     isReportChanged ||
//     isReportChanged === 0 ||
//     missing === true ||
//     valid === false
//   ) {
//     console.log('writing new cache with metadata');
//     // delete old
//     // cacache.rm.entry(cacheLocation, file.path);
//     // cacache.rm.content(
//     //   cacheLocation,
//     //   (cacheFile && cacheFile.integrity) || file.integrity,
//     // );
//     // cacache.verify(cacheLocation);

//     // re-add with metadata
//     cacache.put(cacheLocation, file.path, file.contents.toString(), {
//       metadata: {
//         results,
//         errorCount,
//         warningCount,
//       },
//     });
//   }

//   format(results);
// }

// if (valid && missing === false) {
//   console.log('from cache');
//   format(cacheFile.metadata.results);
// }
