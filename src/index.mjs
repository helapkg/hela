/**
 * @copyright 2017-present, Charlike Mike Reagent <olsten.larck@gmail.com>
 * @license Apache-2.0
 */

import execa from 'execa';
import pMap from 'p-map-series';
import resolvePlugins from 'resolve-plugins-sync';
import prettyConfig from '@tunnckocore/pretty-config';

function hela (opts) {
  const options = Object.assign({ argv: {}, prefix: 'hela-config-' }, opts);

  if (options.tasks || (options.presets || options.extends)) {
    return handler(options);
  }

  return prettyConfig('hela', options).then((config) => {
    if (!config) {
      throw new Error('hela: no config');
    }

    return handler(Object.assign({}, config, options));
  });
}

function handler (opts) {
  return new Promise((resolve) => {
    resolve(presetResolver(opts));
  });
}

function arrayify (val) {
  const arrify = (v) => (Array.isArray(v) ? val : [v]);
  return val ? arrify(val) : [];
}

// todo: externalize as `hela-resolver`?
function presetResolver (opts) {
  const presets = arrayify(opts.presets || opts.extends);

  if (presets.length > 0) {
    const arg = Object.assign({}, opts);
    const options = Object.assign({ first: arg }, opts);
    const tasks = resolvePlugins(presets, options).reduce(
      (acc, preset) => presetReducer(acc, preset),
      {}
    );

    return transformTasks(opts, Object.assign({}, tasks, opts.tasks));
  }

  return transformTasks(opts, opts.tasks);
}

function presetReducer (acc, preset) {
  return preset.presets || preset.extends
    ? presetResolver(preset)
    : Object.assign({}, acc, preset.tasks || preset);
}

function transformTasks (opts, tasks) {
  return Object.keys(Object.assign({}, tasks))
    .filter(isValidTask)
    .reduce(taskReducer(opts, tasks), {});
}

function isValidTask (val) {
  return (
    typeof val === 'string' || typeof val === 'function' || Array.isArray(val)
  );
}

function taskReducer (opts, tasks) {
  return (acc, name) => {
    const task = tasks[name];

    if (typeof task === 'string' || Array.isArray(task)) {
      acc[name] = () => exec(task, opts);
    }
    if (typeof task === 'function') {
      acc[name] = () => task(opts);
    }

    return acc;
  };
}

function exec (cmds, opts) {
  return factory('exec')(cmds, opts);
}

function shell (cmds, opts) {
  return factory('shell')(cmds, opts);
}

function factory (type) {
  const cmd = {
    exec: execa,
    shell: execa.shell,
  };

  return (cmds, opts) => {
    const commands = [].concat(cmds);
    const options = Object.assign(
      { stdio: 'inherit', cwd: process.cwd(), preferLocal: true },
      opts
    );

    const mapper = (cmdLine) => {
      const run = cmd[type];

      if (type === 'shell') {
        return run(cmdLine, options);
      }

      const parts = cmdLine.split(' ');
      return run(parts.shift(), parts, options);
    };

    return pMap(commands, mapper);
  };
}

export { hela, exec, shell };
