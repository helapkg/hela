/**
 * @copyright 2017-present, Charlike Mike Reagent <olsten.larck@gmail.com>
 * @license Apache-2.0
 */

const execa = require('execa-pro')
const arrayify = require('arrayify')
const resolvePlugins = require('resolve-plugins-sync')
const prettyConfig = require('@tunnckocore/pretty-config')

module.exports = { hela, exec, shell }

/**
 * > Controls, merges and resolves all tasks from config files
 * > and passed through `opts.tasks`.
 * >
 * > All `opts` are passed to [execa-pro][] and to [execa][],
 * > so you can pass `opts.stdio: 'inherit'` for example
 * > to output the result of each command in the console, useful for things like prompt inputs.
 * > Resolving works recursively and support ESLint style presets through
 * > the `opts.extends`. The `extends` property can be `string` (the name of the preset,
 * > prefixed with `hela-config-`),  a function (that is passed with `{ extends, tasks }` object)
 * > or an object containing another `extends` and/or `tasks` properties.
 * >
 * > Configuration is handled by [@tunnckocore/pretty-config][] which is pretty similar
 * > to the [cosmiconfig][] package and so the config files lookup order is:
 * > - `.helarc.{json,yaml,yml,js}`
 * > - `hela.config.js`
 * > - `.hela.config.js`
 * > - `.helarc` - YAML or JSON syntax
 * > - `package.json` - one of `hela`, `helaConfig` or `config.hela` fields
 *
 * @name    .hela
 * @param   {Object} `opts` requires to have at least `tasks` ot `extends` properties
 * @returns {Promise} so you can use `async/await` mechanism
 * @api public
 */

async function hela (opts) {
  const options = Object.assign(
    { argv: {}, prefix: 'hela-config-', stdio: 'inherit' },
    opts
  )

  if (options.tasks || (options.presets || options.extends)) {
    return presetResolver(options)
  }

  return prettyConfig('hela', options).then((config) => {
    if (!config) {
      throw new Error('hela: no config')
    }

    return presetResolver(Object.assign({}, config, options))
  })
}

/**
 * > A mirror of [execa-pro][]'s `.exec` method, see its docs. This is also
 * included in the object that is passed to each task if the task is a function.
 *
 * @name    .exec
 * @param   {string|Array} `cmds` commands to call, if array of strings executes in series
 * @param   {Object} `options` optional, passed to [execa-pro][] and so to [execa][]
 * @returns {Promise} so you can use `async/await` mechanism
 * @api public
 */

async function exec (cmds, options) {
  return factory('exec')(cmds, options)
}

/**
 * > A mirror of [execa-pro][]'s `.shell` method, see its docs. This is also
 * included in the object that is passed to each task if the task is a function.
 *
 * @name    .shell
 * @param   {string|Array} `cmds` commands to call, if array of strings executes in series
 * @param   {Object} `options` optional, passed to [execa-pro][] and so to [execa][]
 * @returns {Promise} so you can use `async/await` mechanism
 * @api public
 */

async function shell (cmds, options) {
  return factory('shell')(cmds, options)
}

/**
 * Utils
 */

function factory (type, opts) {
  return (cmds, options) => {
    const cmd = { exec: execa.exec, shell: execa.shell }
    return cmd[type](cmds, Object.assign({}, opts, options))
  }
}

// todo: externalize as `hela-resolver`?
function presetResolver (opts) {
  const presets = arrayify(opts.presets || opts.extends)

  if (presets.length > 0) {
    const arg = Object.assign({}, opts)
    const options = Object.assign({ first: arg }, opts)
    const tasks = resolvePlugins(presets, options).reduce(
      (acc, preset) => presetReducer(acc, preset),
      {}
    )

    return transformTasks(opts, Object.assign({}, tasks, opts.tasks))
  }

  return transformTasks(opts, opts.tasks)
}

function presetReducer (acc, preset) {
  return preset.presets || preset.extends
    ? presetResolver(preset)
    : Object.assign({}, acc, preset.tasks || preset)
}

function transformTasks (opts, tasks) {
  return Object.keys(Object.assign({}, tasks))
    .filter(isValidTask)
    .reduce(taskReducer(opts, tasks), {})
}

function isValidTask (val) {
  return typeof val === 'string' || typeof val === 'function' || Array.isArray(val)
}

function taskReducer (opts, tasks) {
  return (acc, name) => {
    const task = tasks[name]

    if (typeof task === 'string' || Array.isArray(task)) {
      acc[name] = () => shell(task, opts)
    }
    if (typeof task === 'function') {
      const helpers = {
        hela,
        exec: factory('exec', opts),
        shell: factory('shell', opts),
        helaExec: factory('exec', opts),
        helaShell: factory('shell', opts),
      }

      const options = Object.assign({}, opts, helpers)

      acc[name] = () => task(options)
    }

    return acc
  }
}
