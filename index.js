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

function shell (cmds, opts) {
  const options = Object.assign({ stdio: 'inherit', cwd: process.cwd() }, opts)
  const commands = [].concat(cmds)

  const mapper = (cmdLine) => {
    const parts = cmdLine.split(' ')
    return execa(parts.shift(), parts, options).catch((er) =>
      app.emit('error', er)
    )
  }

  return pMap(commands, mapper)
}

hela.shell = shell
hela.hela = hela

module.exports = exports = hela
