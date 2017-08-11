/*!
 * hela <https://github.com/tunnckoCore/hela>
 *
 * Copyright (c) 2017 Charlike Mike Reagent <open.source.charlike@gmail.com> (https://i.am.charlike.online)
 * Released under the MIT license.
 */

const fs = require('fs')
const path = require('path')
const pMap = require('p-map-series')
const execa = require('execa')
const dush = require('dush')

const cmd = {
  exec: execa,
  shell: execa.shell,
}

const app = dush()

function hela (argv, tasksDir) {
  const dir = path.resolve(__dirname, tasksDir)

  const commands = fs.readdirSync(dir)

  commands.forEach((name) => {
    const taskName = path.basename(name, path.extname(name))
    const command = require(path.join(dir, name))

    app.on(taskName, command)
  })

  return app
}

function createMirror (type) {
  return (cmds, opts) => {
    const commands = [].concat(cmds)
    const options = Object.assign(
      { stdio: 'inherit', cwd: process.cwd() },
      opts
    )

    const onerror = (er) => app.emit('error', er)

    const mapper = (cmdLine) => {
      const run = cmd[type]

      if (type === 'shell') {
        return run(cmdLine, options).catch(onerror)
      }

      const parts = cmdLine.split(' ')
      return run(parts.shift(), parts, options).catch(onerror)
    }

    return pMap(commands, mapper)
  }
}

hela.exec = (cmds, opts) => createMirror('exec')(cmds, opts)
hela.shell = (cmds, opts) => createMirror('shell')(cmds, opts)
hela.hela = hela

module.exports = exports = hela
