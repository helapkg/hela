'use strict';

const fs = require('fs');
const path = require('path');
const { hela, exec, toFlags } = require('@hela/core');

exports.createJestCommand = function createJestCommand(prog) {
  return (name, description, settings = {}) =>
    (prog || hela())
      .command(name, description)
      .alias(settings.alias)
      .option('-a, --all', 'Run on all packages.')
      .option('-e, --exclude', 'Ignore pattern string.')
      .option(
        '-I, --input',
        'Input patterns for the "lint" command, defaults to src and testing dirs.',
      )
      .option(
        '-m, --testPathPattern',
        'A regexp pattern string that is matched against all tests paths before executing the test.',
      )
      .option(
        '-t, --testNamePattern',
        'Run only tests with a name that matches the regex pattern',
      )
      .option('-o, --onlyChanged', 'Run only on changed packages')
      .action(async (argv) => {
        // switch the env set by default when running Jest. For ensurance.
        process.env.NODE_ENV = name;

        const opts = { ...argv };

        const ignores = opts.exclude;
        const inputs = opts.input;

        // remove custom ones, because Jest fails on unknown options/flags
        [
          'a',
          'm',
          'e',
          'I',
          'input',
          'exclude',
          'bundle',
          'docs',
          'showStack',
          'cwd',
        ].forEach((key) => {
          delete opts[key];
        });

        const flags = toFlags(opts, { allowCamelCase: true });
        // console.log(opts, flags);
        const configDir = path.join(__dirname, 'configs', name);
        const configPath = path.join(configDir, 'config.js');

        // eslint-disable-next-line import/no-dynamic-require, global-require
        const createConfig = require(configDir);

        // ? todo: caching, check if config is different, if not then do not call createConfig
        // ? that's to save some IO

        const config = createConfig({ ...opts, ignores, input: inputs });
        const contents = `module.exports=${JSON.stringify(config)}`;

        fs.writeFileSync(configPath, contents);

        const cmd = `jest -c ${configPath} ${flags}`;
        console.log(cmd);

        try {
          await exec(cmd, { stdio: 'inherit' });
        } catch (err) {
          if (argv.showStack) {
            console.log(err);
          }

          // eslint-disable-next-line unicorn/no-process-exit
          process.exit(1);
        }
      });
};
