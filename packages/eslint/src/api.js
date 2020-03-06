/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-restricted-syntax */
/* eslint-disable max-statements */

'use strict';

const DEFAULT_IGNORE = [
  '**/node_modules/**',
  '**/bower_components/**',
  'flow-typed/**',
  'coverage/**',
  '**/*fixture*/**',
  '{tmp,temp}/**',
  '**/*.min.js',
  '**/bundle.js',
  '**/vendor/**',
  '**/dist/**',
];

const OUR_CONFIG_FILENAME = '.lint.config.js';
const DEFAULT_EXTENSIONS = ['js', 'jsx', 'cjs', 'mjs', 'ts', 'tsx'];
const DEFAULT_INPUTS = [
  `**/src/**/*.{${DEFAULT_EXTENSIONS.join(',')}}`,
  `**/*test*/**/*.{${DEFAULT_EXTENSIONS.join(',')}}`,
];

const fs = require('fs');
const path = require('path');
const memoizeFs = require('memoize-fs');
const codeframe = require('eslint/lib/cli-engine/formatters/codeframe');
const globCache = require('glob-cache');
const { CLIEngine, Linter } = require('eslint');

function resolveConfigSync(filePath, baseConfig, options) {
  const { cwd, ...opt } = { /* cwd: process.cwd(), */ ...options };
  const doNotUseEslintRC = baseConfig && typeof baseConfig === 'object';

  const settings = {
    ...opt,
    baseConfig,
    cache: true,
    useEslintrc: !doNotUseEslintRC,
    cacheLocation: './.cache/custom-eslint-cache',
  };
  settings.extensions = settings.extensions || DEFAULT_EXTENSIONS;

  const engine = new CLIEngine(settings);

  const config = engine.getConfigForFile(filePath);

  return config;
}

async function resolveConfig(filePath, baseConfig, options) {
  const opts = { ...options };
  const memoizer = memoizeFs({
    cachePath: path.join(process.cwd(), '.cache', 'eslint-resolve-config'),
  });

  const memoizedFn = await memoizer.fn(
    opts.dirname
      ? (_) => resolveConfigSync(filePath, baseConfig, options)
      : resolveConfigSync,
  );
  const cfg = await memoizedFn(
    ...(opts.dirname ? [opts.dirname] : [filePath, baseConfig, options]),
  );

  return cfg;
}

function formatCodeframe(rep, log) {
  const res = codeframe(rep.results || rep);
  return log ? console.log(res) : res;
}

function injectIntoLinter(config, linter) {
  if (!config) {
    return linter;
  }

  const linterInstance = linter || new Linter();

  []
    .concat(config.plugins)
    .filter(Boolean)
    .forEach((pluginName) => {
      let plugin = null;

      if (pluginName.startsWith('@')) {
        plugin = require(pluginName);
      } else {
        plugin = require(`eslint-plugin-${pluginName}`);
      }

      // note: defineRules is buggy
      Object.keys(plugin.rules).forEach((ruleName) => {
        linterInstance.defineRule(
          `${pluginName}/${ruleName}`,
          plugin.rules[ruleName],
        );
      });

      // note: otherwise this should work
      // linterInstance.defineRules(
      //   Object.keys(plugin.rules).reduce((acc, ruleName) => {
      //     acc[`${pluginName}/${ruleName}`] = plugin.rules[ruleName];

      //     return acc;
      //   }, {}),
      // );
    });

  if (config.parser && config.parser.startsWith('/')) {
    if (config.parser.includes('babel-eslint')) {
      config.parser = 'babel-eslint';
    } else if (config.parser.includes('@typescript-eslint/parser')) {
      config.parser = '@typescript-eslint/parser';
    }
    // NOTE: more parsers
  }

  // define only when we are passed with "raw" (not processed) config
  if (config.parser && !config.parser.startsWith('/')) {
    linterInstance.defineParser(config.parser, require(config.parser));
  }

  return linterInstance;
}

async function* lintFiles(patterns, options) {
  const opts = { dirs: [], cwd: process.cwd(), ...options };
  opts.exclude = opts.exclude || DEFAULT_IGNORE;
  opts.extensions = opts.extensions || DEFAULT_EXTENSIONS;
  opts.cacheLocation =
    typeof opts.cacheLocation === 'string'
      ? opts.cacheLocation
      : path.join(opts.cwd, '.cache', 'hela-eslint-cache');

  const iterable = await globCache(patterns, opts);

  const engine = new CLIEngine();
  let linter = opts.linter || new Linter();
  let eslintConfig = await tryLoadLintConfig();

  linter = injectIntoLinter(eslintConfig, linter);

  // TODO use `cacache` for caching `options` and
  // based on that force `ctx.changed` if it is `false`

  for await (const ctx of iterable) {
    const meta = ctx.cacheFile && ctx.cacheFile.metadata;

    if (engine.isPathIgnored(ctx.file.path)) {
      // eslint-disable-next-line no-continue
      continue;
    }

    if (ctx.changed) {
      const dirname = path.dirname(ctx.file.path);
      if (opts.dirs.includes(dirname)) {
        eslintConfig = await resolveConfig(ctx.file.path, 0, {
          ...opts,
          dirname,
        });
      }

      const contents = ctx.file.contents.toString();
      const { source, messages } = lint({
        ...opts,
        linter,
        filename: ctx.file.path,
        contents,
        config: eslintConfig || (meta && meta.eslintConfig),
      });

      const res = createReportOrResult('messages', messages, {
        filePath: ctx.file.path,
      });

      const diff = JSON.stringify(res) !== JSON.stringify(meta && meta.report);

      // NOTE: `source` property seems deprecated but formatters need it so..
      yield {
        ...ctx,
        result: { ...res, source },
        eslintConfig: (meta && meta.eslintConfig) || eslintConfig,
      };

      if (diff) {
        // todo update cache with cacache.put
        await ctx.cacache.put(ctx.cacheLocation, ctx.file.path, source, {
          metadata: { report: { ...res, source }, eslintConfig },
        });
      }

      // if (opts.report) {
      //   formatCodeframe([res]);
      // }
    }

    if (ctx.changed === false && ctx.notFound === false) {
      yield {
        ...ctx,
        result: meta.report,
        eslintConfig: meta.eslintConfig || eslintConfig,
      };
      // if (opts.report) {
      //   formatCodeframe([meta.report]);
      // }
    }
  }
}

lintFiles.promise = async function lintFilesPromise(patterns, options) {
  const opts = { ...options };
  const results = [];
  const iterable = await lintFiles(patterns, opts);

  for await (const { result } of iterable) {
    results.push(result);
  }

  return createReportOrResult('results', results);
};

function lint(options) {
  const opts = { ...options };
  const cfg = { ...opts.config, filename: opts.filename };
  const linter = opts.linter || new Linter();
  const filter = (x) =>
    opts.warnings ? true : !opts.warnings && x.severity === 2;

  if (!opts.contents && !opts.text) {
    opts.contents = fs.readFileSync(cfg.filename, 'utf8');
  }
  if (opts.text) {
    cfg.filename = opts.filename || '<text32>';
  }
  if (opts.fix) {
    const { output, messages } = linter.verifyAndFix(opts.contents, cfg);
    if (!opts.text) {
      fs.writeFileSync(cfg.filename, output);
    }

    return { source: output, messages: messages.filter(filter) };
  }

  const messages = linter.verify(opts.contents, cfg);
  return {
    source: opts.contents,
    messages: messages.filter(filter),
  };
}

async function lintText(contents, options) {
  const opts = { ...options };
  let linter = opts.linter || new Linter();

  const eslintConfig = opts.config || (await tryLoadLintConfig());

  linter = injectIntoLinter(eslintConfig, linter);
  const { source, messages } = lint({
    ...opts,
    config: eslintConfig,
    linter,
    contents,
    text: true,
  });

  const result = createReportOrResult('messages', messages, {
    filePath: opts.filename || '<text>',
    source,
  });
  const report = createReportOrResult('results', [result]);

  return { ...report, source };
}

function createReportOrResult(type, results, extra) {
  const ret = {
    ...extra,
    errorCount: 0,
    warningCount: 0,
    fixableErrorCount: 0,
    fixableWarningCount: 0,
  };

  ret[type] = [];

  if (type === 'messages') {
    ret.errorCount = calculateCount('error', results);
    ret.warningCount = calculateCount('warning', results);
  }

  return results.reduce((acc, res) => {
    ret[type].push(res);

    if (type === 'results') {
      acc.errorCount += res.errorCount || 0;
      acc.warningCount += res.warningCount || 0;
      acc.fixableErrorCount += res.fixableErrorCount || 0;
      acc.fixableWarningCount += res.fixableWarningCount || 0;
    }

    return acc;
  }, ret);
}

async function tryLoadLintConfig() {
  const rootDir = process.cwd();
  let cfg = null;

  try {
    cfg = await require(path.join(rootDir, OUR_CONFIG_FILENAME));
  } catch (err) {
    return null;
  }

  return cfg;
}

function calculateCount(type, items) {
  return []
    .concat(items)
    .filter(Boolean)
    .filter((x) => (type === 'error' ? x.severity === 2 : x.severity === 1))
    .reduce((acc) => acc + 1, 0);
}

module.exports = {
  injectIntoLinter,
  tryLoadLintConfig,
  resolveConfigSync,
  resolveConfig,
  formatCodeframe,
  calculateCount,
  createReportOrResult,
  lintFiles,
  lintText,
  lint,

  DEFAULT_IGNORE,
  DEFAULT_INPUT: DEFAULT_INPUTS,
  DEFAULT_INPUTS,
  DEFAULT_EXTENSIONS,
  OUR_CONFIG_FILENAME,
};

// (async () => {
//   // const patterns = 'packages/eslint/src/**/*.js';
//   // const report = await lintFiles(patterns, { fix: true });
//   const report = await lintText('var foo = 123', { fix: true });

//   formatCodeframe(report.results);
//   console.log(report.source); // fixed source code text
// })();
