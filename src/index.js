/**
 * @copyright 2017-present, Charlike Mike Reagent <olsten.larck@gmail.com>
 * @license Apache-2.0
 */

const arrayify = require('arrayify')
const { exec, shell } = require('execa-pro')
const resolvePlugins = require('resolve-plugins-sync')
const prettyConfig = require('@tunnckocore/pretty-config')

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
        exec,
        shell,
        helaExec: exec,
        helaShell: shell,
      }

      const options = Object.assign({}, opts, helpers)

      acc[name] = () => task(options)
    }

    return acc
  }
}

module.exports = { hela, exec, shell }
