/*!
 * hela <https://github.com/tunnckoCore/hela>
 *
 * Copyright (c) 2017 Charlike Mike Reagent <open.source.charlike@gmail.com> (https://i.am.charlike.online)
 * Released under the MIT license.
 */

module.exports = ({ adds, shell }) => {
  console.log('Running `test` command...')
  shell(`nyc --reporter lcov ${adds}`, 'nyc report')
}
