'use strict';

const glob = require('glob-cache');
const { hela } = require('@hela/core');
const memoizeFs = require('./memoize-fs');
const { DEFAULT_INPUTS, DEFAULT_IGNORE, lintFiles } = require('./api');

const memoizer = memoizeFs({
  cachePath: './.cache-memoized',
});

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

      const res = [];
      await glob({
        include,
        exclude,
        globOptions: { cwd: argv.cwd },
        always: true,

        // TODO doooooh
        async hook({ valid, missing, file }) {
          console.log('hit1', valid, missing);

          if (valid === false || (valid && missing)) {
            console.log('hit2');

            const memoizeFn = await memoizer.fn(
              async (fp, opt) => {
                let rz = null;

                if (valid === false || (valid && missing)) {
                  rz = await lintFiles(fp, opt);

                  return {
                    result: rz.results[0],
                    output: rz.format(rz.results),
                  };
                }

                return { results: rz.results, output: rz.format(rz.results) };
              },
              { cacheId: file.path },
            );

            const result = await memoizeFn(file.path, argv);
            console.log(result.output);
            res.push(result);
          } else {
            console.log('ss', res);
          }
        },
      });
    });
}

function helaCommand() {
  return wrapper(hela().command('eslint [...files]', 'Lint using ESLint'));
}

module.exports = {
  /* lintText, lintFiles, */
  wrapper,
  helaCommand,
};
