/**
 * @author Charlike Mike Reagent <open.source.charlike@gmail.com>
 * @copyright 2017 tunnckoCore and other contributors
 * @license MIT
 */

import parser from 'mri'
import { hela, exec, shell } from './index.js'

const options = { cwd: process.cwd(), hela, helaExec: exec, helaShell: shell }

options.parse = (opts) => parser(process.argv.slice(2), opts)
options.argv = options.parse()
options.taskName = options.argv._[0]

if (!options.argv._.length) {
  console.log('Usage: hela <taskName>')
  process.exit(1)
}

const onerror = (er) => {
  // Don't show stack/message
  // if it is `nyc check-coverage` command,
  // because it is already show that threshold is not meet
  const isNyc = er.message.indexOf('nyc') > 0
  const isCov = er.message.indexOf('check-coverage') > 0
  if (!isNyc && !isCov) {
    console.error('ERR!', er.stack || er.message)
    throw er
  }
}

hela(options)
  .then((tasks) => tasks[options.taskName]())
  .then(() => process.exit(0))
  .catch(onerror)
  .catch(() => process.exit(1))
