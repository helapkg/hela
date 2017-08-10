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

const onerror = (er) => process.exit(1)

const app = hela(argv, './tasks')

app.once('error', onerror)
app.emit(task, { app, adds, argv, shell })
