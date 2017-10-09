import execa from 'execa'
import pMap from 'p-map-series'
import resolvePlugins from 'resolve-plugins-sync'
import prettyConfig from './pretty-config.js'

/* eslint-disable max-line */

function hela (opts) {
  opts = Object.assign({ argv: {} }, opts)

  if (opts.tasks || (opts.presets || opts.extends)) {
    return handler(opts)
  }

  return prettyConfig('hela', opts).then((config) => {
    if (!config) {
      throw new Error('hela: no config')
    }

    return handler(Object.assign({}, config, opts))
  })
}

function handler (opts) {
  return new Promise((resolve, reject) => {
    resolve(presetResolver(opts))
  })
}

// todo: externalize as `hela-resolver`?
function presetResolver (opts) {
  const presets = opts.presets || opts.extends

  if (presets.length > 0) {
    // const prefix = 'hela-preset-'
    const tasks = resolvePlugins(presets /* , { prefix } */).reduce(
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
    : Object.assign({}, acc, preset.tasks)
}

function transformTasks (opts, tasks) {
  return Object.keys(Object.assign({}, tasks))
    .filter(isValidTask)
    .reduce(taskReducer(opts, tasks), {})
}

function isValidTask (val) {
  return (
    typeof val === 'string' || typeof val === 'function' || Array.isArray(val)
  )
}

function taskReducer (opts, tasks) {
  return (memo, name) => {
    const task = tasks[name]

    if (typeof task === 'string' || Array.isArray(task)) {
      memo[name] = () => exec(task, opts)
    }
    if (typeof task === 'function') {
      memo[name] = () => task(opts)
    }

    return memo
  }
}

function exec (cmds, opts) {
  return factory('exec')(cmds, opts)
}

function shell (cmds, opts) {
  return factory('shell')(cmds, opts)
}

function factory (type) {
  const cmd = {
    exec: execa,
    shell: execa.shell,
  }

  return (cmds, opts) => {
    const commands = [].concat(cmds)
    const options = Object.assign(
      { stdio: 'inherit', cwd: process.cwd() },
      opts
    )

    const mapper = (cmdLine) => {
      const run = cmd[type]

      if (type === 'shell') {
        return run(cmdLine, options)
      }

      const parts = cmdLine.split(' ')
      return run(parts.shift(), parts, options)
    }

    return pMap(commands, mapper)
  }
}

export { hela, exec, shell }
