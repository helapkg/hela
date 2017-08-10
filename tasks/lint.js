/*!
 * hela <https://github.com/tunnckoCore/hela>
 *
 * Copyright (c) 2017 Charlike Mike Reagent <open.source.charlike@gmail.com> (https://i.am.charlike.online)
 * Released under the MIT license.
 */

const execa = require('execa')
const stream = require('stream')

module.exports = ({ app, adds, argv, shell }) => {
  console.log('Running `lint` command...')
  execa(
    `eslint`,
    [
      `${adds}`,
      `-c`,
      `${argv.config}`,
      `--format`,
      `${argv.reporter}`,
      `--fix`,
    ],
    { stdio: 'inherit' }
  )
    .then(() => {
      console.log('done lint')
    })
    .catch((er) => app.emit('error', er))
}

// const stream = require('stream')

// module.exports = ({ adds, argv, shell }) => {
//   console.log('Running `lint` command...')
//   shell(`eslint ${adds} -c ${argv.config} --format ${argv.reporter} --fix`)
// }
