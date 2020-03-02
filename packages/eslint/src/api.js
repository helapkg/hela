/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-restricted-syntax */
/* eslint-disable max-statements */

'use strict';

const fs = require('fs');
const path = require('path');
const arrayify = require('arrify');
const memoizeFs = require('memoize-fs');
// const serialize = require('serialize-javascript');
const { CLIEngine, Linter } = require('eslint');
const glob = require('./globbing');

// const foo = 2;

const DEFAULT_IGNORE = [
  '**/node_modules/**',
  '**/bower_components/**',
  'flow-typed/**',
  'coverage/**',
  '**/*fixture*/**',
  '{tmp,temp}/**',
  '**/*.min.js',
  '**/bundle.js',
  'vendor/**',
  'dist/**',
];

const DEFAULT_INPUTS = ['**/src/**', '**/*test*/**'];
const DEFAULT_EXTENSIONS = ['js', 'jsx', 'cjs', 'mjs', 'ts', 'tsx'];
// const DEFAULT_OPTIONS = {
//   exit: true,
//   warnings: false,
//   reporter: 'codeframe',
//   input: DEFAULT_INPUTS,
//   exclude: DEFAULT_IGNORE,
//   extensions: DEFAULT_EXTENSIONS,
//   reportUnusedDisableDirectives: true,
// };

// function normalizeOptions(options) {
//   const forcedOptions = {
//     fix: true,
//     baseConfig: {
//       extends: [
//         '@tunnckocore/eslint-config',
//         '@tunnckocore/eslint-config/mdx',
//         '@tunnckocore/eslint-config/jest',
//         '@tunnckocore/eslint-config/node',
//         '@tunnckocore/eslint-config/promise',
//         '@tunnckocore/eslint-config/unicorn',
//       ],
//     },
//     useEslintrc: false,
//     cache: true,
//     cacheLocation: './.eslintcache',
//   };
//   const opts = { ...DEFAULT_OPTIONS, ...options, ...forcedOptions };

//   opts.input = arrayify(opts.input);
//   opts.ignore = DEFAULT_IGNORE.concat(arrayify(opts.ignore));
//   opts.extensions = arrayify(opts.extensions);

//   return opts;
// }

/**
  Using CLIEngine executeOnFiles

  1. Has 6 huge (1000 lines) files
    - eslint 13 files (fresh, no cache) ~6.16s
    - eslint 13 files (warm cache) ~2.75s

  2. Each file has around ~200 lines
    - eslint 5 files (fresh, no cache) ~3.07s, 126mb, ~1300 switches, 16 outputs
    - eslint 5 files (warm cache) ~2.56s, 120mb, ~1100 switches, 16 outputs
 */

/**
  Using `linter.verify` API
  and aggressive caching & memoization

  1. Has 6 huge (1000 lines) files
    - @hela/eslint 13 files (fresh, no cache) ~3.72s
    - @hela/eslint 13 files (warm cache) ~0.6s

  2. Each file has around ~200 lines
    - @hela/eslint 5 files (fresh, no cache) - 2.64s, 119mb, ~1440 switches, ~740 outputs
    - @hela/eslint 5 files (warm cache) - 0.6s, 56mb, ~600 switches, ~72 outputs
 */
// function lint(name) {
//   return async (value, fp, options) => {
//     if (name === 'files') {
//       // eslint-disable-next-line no-param-reassign
//       options = fp;
//     }
//     const opts = normalizeOptions(options);

//     const engine = new CLIEngine(opts);
//     const fn = name === 'files' ? engine.executeOnFiles : engine.executeOnText;
//     const report = fn.apply(
//       engine,
//       [value, name === 'text' && fp].filter(Boolean),
//     );

//     report.format = engine.getFormatter(opts.reporter);

//     if (name === 'files') {
//       CLIEngine.outputFixes(report);
//     }

//     return report;
//   };
// }

// async function lintText(code, fp, options) {
//   return lint('text')(code, fp, options);
// }

// async function lintFiles(code, fp, options) {
//   return lint('files')(code, fp, options);
// }

// 1. respect eslintignore (merge with default ignores)
// 2. some random (e.g. import/no-unresolved) rules are reporting errors
// 3. the memory leak (the `eslintConfig = {}`)
// 4. use fast-glob Stream API + cacache directly instead of glob-cache?
async function smartLintFiles(settings) {
  const {
    include,
    exclude,
    useIterables,
    usePromises,
    useGlobCache,
    ...options
  } = settings;

  const report = {
    results: [],
    errorCount: 0,
    warningCount: 0,
    fixableErrorCount: 0,
    fixableWarningCount: 0,
  };

  if (useIterables) {
    await useIterables({ include, exclude, ...options }, report);
  }
  if (usePromises) {
    await usePromises({ include, exclude, ...options }, report);
  }
  if (useGlobCache) {
    await useGlobCache({ include, exclude, ...options }, report);
  }

  return report;
}

module.exports = {
  smartLintFiles,
  DEFAULT_IGNORE,
  DEFAULT_INPUT: DEFAULT_INPUTS,
  DEFAULT_INPUTS,
  DEFAULT_EXTENSIONS,
};

// exports.normalizeOptions = normalizeOptions;
// exports.lint = lint;
// exports.lintText = lintText;
// exports.lintFiles = lintFiles;
// exports.smartLintFiles = smartLintFiles;
// exports.DEFAULT_IGNORE = DEFAULT_IGNORE;
// exports.DEFAULT_INPUTS = DEFAULT_INPUTS;
// exports.DEFAULT_INPUT = DEFAULT_INPUTS;

// function createAlwaysHook(opts, engine, report) {
//   const verifyCachePath = path.join(opts.cwd, '.cache', 'verify-process');
//   const configsCachePath = path.join(opts.cwd, '.cache', 'directory-config');

//   const memoizerVerify = memoizeFs({ cachePath: verifyCachePath });
//   const linter = new Linter({ cwd: opts.cwd });

//   const eslintConfig = {};

//   return async (ctx) => {
//     const { file, changed, notFound, cacheFile, cacache, cacheLocation } = ctx;

//     const fileDirname = path.dirname(file.path);
//     let config = opts.useConfigCache
//       ? await getConfigForDirectory(fileDirname, {
//           cachePath: configsCachePath,
//           cacache,
//         })
//       : null;

//     if (!config) {
//       config = eslintConfig[fileDirname] || engine.getConfigForFile(file.path);

//       if (opts.useConfigCache) {
//         await cacache.put(
//           configsCachePath,
//           fileDirname,
//           JSON.stringify(config),
//         );
//       } else {
//         eslintConfig[fileDirname] = config;
//       }
//     }

//     if (changed || notFound) {
//       injectToLinter({ config, linter });
//     }

//     const contents = file.contents.toString();
//     const memoizedFunc = await memoizerVerify.fn((cont, cfg) =>
//       // console.log('content changed! ... verify called');

//       linter.verifyAndFix(cont, cfg),
//     );
//     const { output, messages } = await memoizedFunc(contents, config);

//     const result = {
//       filePath: file.path,
//       messages,
//       errorCount: calculateCount('error', messages, report),
//       warningCount: calculateCount('warning', messages, report),
//       fixableErrorCount: 0,
//       fixableWarningCount: 0,
//     };

//     const meta = cacheFile && cacheFile.metadata;
//     const diff = JSON.stringify(result) !== JSON.stringify(meta && meta.report);

//     if (diff) {
//       // console.log('report changed! re-add / store to cache');
//       cacache.put(cacheLocation, file.path, output, {
//         metadata: { report: result },
//       });
//     }
//     if (diff || changed) {
//       fs.writeFileSync(file.path, output);
//       report.results.push(result);
//     }
//   };
// }

// async function getConfigForDirectory(key, { cachePath, cacache }) {
//   const info = await cacache.get.info(cachePath, key);
//   let configCache = null;

//   if (info) {
//     try {
//       configCache = JSON.parse(fs.readFileSync(info.path, 'utf8'));
//     } catch (err) {}
//   }

//   return configCache;
// }

// function injectToLinter({ config, linter }) {
//   config.plugins.forEach((pluginName) => {
//     let plugin = null;

//     if (pluginName.startsWith('@')) {
//       plugin = require(pluginName);
//     } else {
//       plugin = require(`eslint-plugin-${pluginName}`);
//     }

//     Object.keys(plugin.rules).forEach((ruleName) => {
//       linter.defineRule(`${pluginName}/${ruleName}`, plugin.rules[ruleName]);
//     });
//   });
//   if (config.parser) {
//     linter.defineParser(config.parser, require(config.parser));
//   }

//   return linter;
// }

// function calculateCount(type, messages, report) {
//   const rep = report;
//   return []
//     .concat(messages)
//     .filter(Boolean)
//     .filter((x) => (type === 'error' ? x.severity === 2 : x.severity === 1))
//     .reduce((acc) => {
//       if (type === 'error') {
//         rep.errorCount += 1;
//       }
//       if (type === 'warning') {
//         rep.warningCount += 1;
//       }

//       return acc + 1;
//     }, 0);
// }

// always: true,

//   async hook({ valid, missing, file, cacheFile, cacheLocation, cacache }) {
//     // if (valid === false || (valid && missing)) {

//     const relativePath = path.relative(process.cwd(), file.path);
//     console.log(engine.isPathIgnored(relativePath), file.path);
//     if (engine.isPathIgnored(relativePath)) {
//       console.log(
//         'ignored',
//         file.path,
//         // path.relative(process.cwd(), file.path),
//       );
//       return;
//     }

//     const meta = cacheFile && cacheFile.metadata;
//     // const config = meta
//     //   ? meta.eslintConfig
//     //   : engine.getConfigForFile(file.path);

//     const dirname = path.dirname(file.path);
//     let config = null;
//     if (eslintConfig[dirname]) {
//       // console.log('using config for', dirname);
//       config = eslintConfig[dirname];
//     } else {
//       // console.log('new config');
//       config = meta ? meta.eslintConfig : engine.getConfigForFile(file.path);
//       eslintConfig[dirname] = config;
//     }

//     if (valid === false || (valid && missing)) {
//       config.plugins.forEach((pluginName) => {
//         let plugin = null;

//         if (pluginName.startsWith('@')) {
//           // eslint-disable-next-line import/no-dynamic-require, global-require
//           plugin = require(pluginName);
//         } else {
//           // eslint-disable-next-line import/no-dynamic-require, global-require
//           plugin = require(`eslint-plugin-${pluginName}`);
//         }

//         Object.keys(plugin.rules).forEach((ruleName) => {
//           linter.defineRule(
//             `${pluginName}/${ruleName}`,
//             plugin.rules[ruleName],
//           );
//         });
//       });
//     }

//     const contents = file.contents.toString();
//     const memoizedFunc = await memoizer.fn((cont, cfg) =>
//       // console.log('content changed! ... verify called');

//       linter.verifyAndFix(cont, cfg),
//     );
//     const { output, messages } = await memoizedFunc(contents, config);

//     const result = {
//       filePath: file.path,
//       messages,
//       errorCount: []
//         .concat(messages)
//         .filter(Boolean)
//         .filter((x) => x.severity === 2)
//         .reduce((acc) => {
//           report.errorCount += 1;

//           return acc + 1;
//         }, 0),
//       warningCount: []
//         .concat(messages)
//         .filter(Boolean)
//         .filter((x) => x.severity === 1)
//         .reduce((acc) => {
//           report.warningCount += 1;

//           return acc + 1;
//         }, 0),
//       fixableErrorCount: 0,
//       fixableWarningCount: 0,
//     };

//     if (JSON.stringify(result) !== JSON.stringify(meta && meta.report)) {
//       // console.log('report changed! re-add / store to cache');

//       cacache.put(cacheLocation, file.path, output, {
//         metadata: {
//           contents,
//           output,
//           report: result,
//           eslintConfig: config,
//         },
//       });
//     }

//     if (valid === false || (valid && missing) || valid) {
//       fs.writeFileSync(file.path, output);
//       report.results.push({ ...result, source: output });
//     }
//   },
