#!/usr/bin/env node

/*!
 * hela <https://github.com/tunnckoCore/hela>
 *
 * Copyright (c) 2017 Charlike Mike Reagent <open.source.charlike@gmail.com> (https://i.am.charlike.online)
 * Released under the MIT license.
 */

const argv = require('mri')(process.argv.slice(2), {
  alias: {
    c: 'config',
    r: 'reporter',
  },
  default: {
    config: './.eslintrc.json',
    reporter: 'codeframe',
  },
  string: ['config', 'reporter'],
})

const { hela, shell } = require('./index')

const task = argv._.shift()
const adds = argv._.join(' ')

const onerror = er => {
  console.log(er)
  process.exit(1)
}

const app = hela(argv, './tasks')

app.once('error', onerror)
app.emit(task, { app, adds, argv, shell })

// hela(argv, './tasks')
//   .then((app) => {
//     if (!app._allEvents[task]) {
//       return onerror(new Error('no such task: ' + task))
//     }

//     app.once('error', onerror)
//     app.emit(task, { app, adds, argv, shell })
//   })
//   .then(() => process.exit(0))
//   .catch(onerror)
