/*!
 * hela <https://github.com/tunnckoCore/hela>
 *
 * Copyright (c) 2017 Charlike Mike Reagent <open.source.charlike@gmail.com> (https://i.am.charlike.online)
 * Released under the MIT license.
 */

module.exports = ({ adds, argv, exec }) => {
  console.log('Running `lint` command...')

  adds = adds || '.'

  exec(`eslint ${adds} -c ${argv.config} --format ${argv.reporter} --fix`)
}
