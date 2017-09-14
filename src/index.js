import path from 'path'
import execa from 'execa'
import pMap from 'p-map-series'
import arrayify from 'arrify'
import prettyConfig from './pretty-config.js'

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
    const hasTasks = (val) => Object.keys(Object.assign({}, val)).length > 0
    opts.presets = arrayify(opts.presets)

    if (opts.presets.length) {
      const name = opts.presets[0] // handle more presets?
      const req = name[0] === '.' ? path.resolve(name) : `hela-preset-${name}`
      const tasks = require(req)
      opts.tasks = hasTasks(opts.tasks)
        ? Object.assign({}, tasks, opts.tasks)
        : tasks
    }
    if (!hasTasks(opts.tasks)) {
      throw new Error('hela: no tasks found')
    }

    const tasks = Object.keys(opts.tasks)
      .filter(isValidTask)
      .reduce(reducer(opts), {})

    resolve(tasks)
  })
}

function isValidTask (val) {
  return (
    typeof val === 'string' || typeof val === 'function' || Array.isArray(val)
  )
}

function reducer (opts) {
  return (tasks, name) => {
    const task = opts.tasks[name]

    if (typeof task === 'string' || Array.isArray(task)) {
      tasks[name] = () => exec(task, opts)
    }
    if (typeof task === 'function') {
      tasks[name] = () => task(opts)
    }

    return tasks
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
