#!/usr/bin/env node

/**
 * @copyright 2017-present, Charlike Mike Reagent <olsten.larck@gmail.com>
 * @license Apache-2.0
 */

/* eslint-disable no-console */

const fs = require('fs')
const path = require('path')
const util = require('util')
const parser = require('mri')
const { hela } = require('./index.js')

const options = { cwd: process.cwd() }

options.parse = (opts) => parser(process.argv.slice(2), opts)
options.argv = Object.assign({ silent: true }, options.parse())

const [taskName] = options.argv._
options.taskName = taskName

if (!options.argv._.length) {
  console.log('Usage: hela <taskName>')
  process.exit(1)
}

const readJson = async (fp) => {
  const pkgStr = await util.promisify(fs.readFile)(fp, 'utf8')

  return JSON.parse(pkgStr)
}

// const slientSpecials = (er, name) => {
//   // Don't show stack/message
//   // if it is `nyc check-coverage` command,
//   // because it is already show that threshold is not meet.
//   // if it is `eslint` because it show the report
//   const isEslint = er.message.includes('eslint')
//   const isNyc = er.message.includes('nyc')
//   const isCov = er.message.includes('check-coverage')

//   if (!isNyc && !isCov && !isEslint) {
//     console.error(`hela: task "${name}" failed`)
//     console.error(er.stack || er.message)
//   }
// }

async function run () {
  const pkg = await readJson(path.join(options.cwd, 'package.json'))
  const tasks = await hela({ pkg, ...options })
  const name = options.taskName

  if (Object.keys(tasks).length === 0) {
    throw new Error('hela: no tasks')
  }

  const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k)
  if (!hasOwn(tasks, name)) {
    throw new Error(`hela: no such task -> ${name}`)
  }

  return tasks[name]()
}

run().catch((er) => {
  console.error('hela: task failed')

  if (options.argv.silent === false) {
    console.error(er.stack || er.message)
  }

  process.exit(er.code)
})
