import path from 'path'
import execa from 'execa'
import pMap from 'p-map-series'
import arrayify from 'arrify'
import prettyConfig from './pretty-config.js'

/* eslint-disable max-line */

function hela (opts) {
  opts = Object.assign({ argv: {} }, opts)

  if (opts.tasks || opts.presets) {
    return handle(opts)
  }

  return prettyConfig('hela', opts).then((config) => {
    if (!config) {
      throw new Error('hela: no config')
    }

    return handle(Object.assign({}, config, opts))
  })
}

function handle (opts) {
  return new Promise((resolve, reject) => {
    const tasks = presetResolver(opts)
    resolve(tasks)
  })
}

// todo: externalize as `hela-resolver`?
function presetResolver (preset) {
  preset = Object.assign({}, preset)

  // todo: Workaround for the existing presets. Remove after the `tunnckocore` preset update
  preset.tasks = hasTasks(preset.tasks)
    ? preset.tasks
    : Object.assign({}, preset)

  preset.presets = arrayify(preset.presets)

  let tasks = {}

  if (preset.presets.length > 0) {
    // todo: use & update `resolve-plugins-sync`
    tasks = preset.presets.reduce((acc, item) => {
      if (item[0] === '.') {
        item = path.resolve(item)
      } else if (!item.startsWith('hela-preset')) {
        item = 'hela-preset-' + item
      }

      item = require(item) // eslint-disable-line
      let tasks = hasTasks(preset.tasks)
        ? Object.assign({}, presetResolver(item), preset.tasks)
        : presetResolver(item)

      tasks = transformTasks(preset, tasks)
      return Object.assign({}, acc, tasks)
    }, {})
  } else {
    tasks = transformTasks(preset, preset.tasks)
  }

  return tasks
}

function hasTasks (val) {
  return Object.keys(Object.assign({}, val)).length > 0
}

function transformTasks (opts, tasks) {
  return Object.keys(Object.assign({}, tasks))
    .filter(isValidTask)
    .reduce(reducer(opts, tasks), {})
}

function isValidTask (val) {
  return (
    typeof val === 'string' || typeof val === 'function' || Array.isArray(val)
  )
}

function reducer (opts, tasks) {
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
